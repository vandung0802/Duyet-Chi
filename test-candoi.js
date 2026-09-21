const fs=require('fs'),vm=require('vm'),os=require('os');
// Tu tim khoi tinh toan (tu 'let cashflow' den truoc 'function setCashTab')
// -> sua giabinh.html bao nhieu lan test van chay dung, khong phu thuoc so dong.
const L=fs.readFileSync('giabinh.html','utf8').split(/\r?\n/);
const a=L.findIndex(x=>x.startsWith('let cashflow = []'));
const b=L.findIndex(x=>x.startsWith('function setCashTab('));
if(a<0||b<0){console.log('Khong tim thay khoi code can doi');process.exit(1);}
const code=L.slice(a,b).join(os.EOL);
const ctx={console}; vm.createContext(ctx);
vm.runInContext(`
function approvedAmtOf(p,who){const hist=who==='H'?p.approvedHHistory:p.approvedDHistory;
 if(Array.isArray(hist))return hist.reduce((a,t)=>a+(parseFloat(t.amount)||0),0);
 return parseFloat(who==='H'?p.approvedHAmount:p.approvedDAmount)||0;}
function getOfficialApprovedAmount(p){const h=approvedAmtOf(p,'H'),d=approvedAmtOf(p,'D');return h>0?h:d;}
function getTotalTransferred(p){if(!Array.isArray(p.transfers))return 0;
 return p.transfers.reduce((a,t)=>a+(parseFloat(t.amount)||0),0);}
var db={ref(){return{off(){},on(){}}}};
var document={getElementById(){return null}};
`, ctx);
vm.runInContext(code, ctx);

// 'let cashflow' la bien lexical trong vm -> phai gan TU BEN TRONG vm
const setup=(cf,pr)=>vm.runInContext('cashflow='+JSON.stringify(cf)+';proposals='+JSON.stringify(pr)+';',ctx);
const totals=()=>vm.runInContext('cashTotals()',ctx);
const tr=n=>Math.round(n/1e6)+'tr';
let pass=true;
const check=(name,got,want)=>{const ok=Math.abs(got-want)<1;if(!ok)pass=false;
  console.log((ok?'  OK  ':'  SAI ')+name.padEnd(24)+tr(got)+(ok?'':'   <-- mong doi '+tr(want)));};

console.log('== Vi du cua D ==');
setup([
  {id:'1',type:'in',amount:700e6,src:'cdt',date:'2026-01-10'},
  {id:'2',type:'in',amount:200e6,src:'134',date:'2026-02-10'},
  {id:'3',type:'in',amount:100e6,src:'pva',date:'2026-02-15'},
  {id:'4',type:'dep',amount:75e6,desc:'Ky quy bao lanh',date:'2026-03-10'},
  {id:'5',type:'dep',amount:5e6, desc:'Coc oxy',date:'2026-05-02'}
],[
  {status:'approved',approvedHHistory:[{amount:850e6}],transfers:[{amount:850e6,ts:Date.now()}]},
  {status:'approved',approvedHHistory:[{amount:25e6}],transfers:[]},
  {status:'pending',transfers:[]},
  {status:'rejected',approvedHHistory:[{amount:999e6}],transfers:[]}
]);
let t=totals();
check('Da thu ve',t.thu,1000e6);
check('  tu CDT',t.thuBySrc.cdt,700e6);
check('  tu 134',t.thuBySrc['134'],200e6);
check('  tu PVA',t.thuBySrc.pva,100e6);
check('Da chi ra',t.daChi,850e6);
check('Dang gui ngoai',t.dangGuiNgoai,80e6);
check('TIEN TRONG TAI KHOAN',t.tienTrongTk,70e6);
check('Da duyet chua chuyen',t.daDuyetChuaChuyen,25e6);
check('CON DUOC TIEU',t.conDuocTieu,45e6);

console.log('\n== Doi ve 75tr ky quy ==');
vm.runInContext('cashflow[3].returned=[{amount:75e6,date:"2026-09-01"}];',ctx);
t=totals();
check('Dang gui ngoai',t.dangGuiNgoai,5e6);
check('Tien trong TK',t.tienTrongTk,145e6);

console.log('\n== Chuyen tung phan (duyet 100tr, chuyen 40tr) ==');
setup([{id:'a',type:'in',amount:100e6,src:'cdt',date:'2026-01-01'}],
      [{status:'approved',approvedHHistory:[{amount:100e6}],transfers:[{amount:40e6,ts:Date.now()}]}]);
t=totals();
check('Da chi ra',t.daChi,40e6);
check('Da duyet chua chuyen',t.daDuyetChuaChuyen,60e6);
check('CON DUOC TIEU',t.conDuocTieu,0);

console.log('\n== Quy am (thu 50tr, duyet 80tr chua chuyen) ==');
setup([{id:'a',type:'in',amount:50e6,src:'cdt',date:'2026-01-01'}],
      [{status:'approved',approvedHHistory:[{amount:80e6}],transfers:[]}]);
check('CON DUOC TIEU (am)',totals().conDuocTieu,-30e6);

console.log('\n== Phieu UNG LUONG cung phai tinh vao chi ==');
setup([{id:'a',type:'in',amount:100e6,src:'cdt',date:'2026-01-01'}],
      [{status:'approved',kind:'salary',approvedHHistory:[{amount:10e6}],transfers:[{amount:10e6,ts:Date.now()}]}]);
check('Da chi ra',totals().daChi,10e6);

console.log('\n== Khong co du lieu ==');
setup([],[]);
check('Con duoc tieu',totals().conDuocTieu,0);


console.log('\n== Phieu KY QUY: KHONG duoc tru 2 lan ==');
// Duyet 100tr ky quy, Toan chuyen 100tr -> app tu sinh khoan dep 100tr.
// Neu con cong vao daChi nua thi tien trong TK bi tru 2 lan (-200tr thay vi -100tr).
setup([
  {id:'a',type:'in',amount:500e6,src:'cdt',date:'2026-01-01'},
  {id:'p_x_1',type:'dep',amount:100e6,desc:'Ky quy bao lanh',date:'2026-02-01',fromProposal:'x'}
],[
  {id:'x',status:'transferred',costType:'kyquy',approvedHHistory:[{amount:100e6}],transfers:[{amount:100e6,ts:Date.now()}]}
]);
let k=totals();
check('Da chi ra (phai = 0)',k.daChi,0);
check('Dang gui ngoai',k.dangGuiNgoai,100e6);
check('Tien trong TK',k.tienTrongTk,400e6);
check('Con duoc tieu',k.conDuocTieu,400e6);

console.log('\n== Ky quy DA DUYET nhung CHUA chuyen ==');
// Chua chuyen -> chua co khoan dep, nhung van la tien da hua dua di
setup([{id:'a',type:'in',amount:500e6,src:'cdt',date:'2026-01-01'}],
      [{id:'y',status:'approved',costType:'kyquy',approvedHHistory:[{amount:80e6}],transfers:[]}]);
k=totals();
check('Da chi ra',k.daChi,0);
check('Da duyet chua chuyen',k.daDuyetChuaChuyen,80e6);
check('Tien trong TK',k.tienTrongTk,500e6);
check('Con duoc tieu',k.conDuocTieu,420e6);

console.log('\n== Chi cong truong + noi nghiep van tinh binh thuong ==');
setup([{id:'a',type:'in',amount:500e6,src:'cdt',date:'2026-01-01'}],[
  {id:'c1',status:'transferred',costType:'congtruong',approvedHHistory:[{amount:100e6}],transfers:[{amount:100e6,ts:Date.now()}]},
  {id:'c2',status:'transferred',costType:'noinghiep', approvedHHistory:[{amount:20e6}], transfers:[{amount:20e6,ts:Date.now()}]},
  {id:'c3',status:'transferred',approvedHHistory:[{amount:30e6}],transfers:[{amount:30e6,ts:Date.now()}]}
]);
check('Da chi ra (100+20+30)',totals().daChi,150e6);

console.log('\n== Ky quy chuyen LAM 2 LAN -> 2 khoan rieng ==');
setup([
  {id:'a',type:'in',amount:500e6,src:'cdt',date:'2026-01-01'},
  {id:'p_z_1',type:'dep',amount:60e6,date:'2026-02-01',fromProposal:'z'},
  {id:'p_z_2',type:'dep',amount:40e6,date:'2026-03-01',fromProposal:'z'}
],[
  {id:'z',status:'transferred',costType:'kyquy',approvedHHistory:[{amount:100e6}],
   transfers:[{amount:60e6,ts:Date.now()},{amount:40e6,ts:Date.now()}]}
]);
k=totals();
check('Dang gui ngoai (60+40)',k.dangGuiNgoai,100e6);
check('Da chi ra',k.daChi,0);
check('Tien trong TK',k.tienTrongTk,400e6);


// ── SO QUY phai KHOP voi bang Tong quan: so du dong cuoi = "Tien trong tai khoan" ──
// (loi da gap: bang Tong quan da loai phieu ky quy khoi "da chi" nhung So quy van liet ke
//  lan chuyen cua no -> tru 2 lan, so du cuoi lech dung bang so ky quy)
{
  const c=L.findIndex(x=>x.startsWith('function cashBookRows('));
  const d=L.findIndex(x=>x.startsWith('function renderCashBook('));
  if(c<0||d<0){ console.log('Khong tim thay cashBookRows'); process.exit(1); }
  vm.runInContext(L.slice(c,d).join(os.EOL), ctx);
}
const soDuCuoi=()=>{ const r=vm.runInContext('cashBookRows()',ctx); return r.length? r[r.length-1].bal : 0; };

console.log('\n== So quy KHOP Tong quan (co ky quy tu phieu chi + ky quy nhap tay + doi ve) ==');
setup([
  {id:'a',type:'in',amount:1000e6,src:'cdt',date:'2026-01-05'},
  {id:'b',type:'in',amount:200e6,src:'134',date:'2026-01-20'},
  {id:'p_x_1',type:'dep',amount:100e6,desc:'Ky quy bao lanh',date:'2026-02-01',fromProposal:'x'},
  {id:'m1',type:'dep',amount:20e6,desc:'Coc gian giao',date:'2026-02-10',returned:[{amount:5e6,date:'2026-03-01',ts:1}]}
],[
  {id:'x',status:'transferred',costType:'kyquy',approvedHHistory:[{amount:100e6}],transfers:[{amount:100e6,ts:Date.UTC(2026,1,1,5)}]},
  {id:'c1',status:'transferred',costType:'congtruong',approvedHHistory:[{amount:300e6}],transfers:[{amount:300e6,ts:Date.UTC(2026,1,3,5)}]},
  {id:'c2',status:'approved',costType:'noinghiep',approvedHHistory:[{amount:50e6}],transfers:[{amount:10e6,ts:Date.UTC(2026,1,4,5)}]},
  {id:'s1',status:'transferred',kind:'salary',approvedHHistory:[{amount:15e6}],transfers:[{amount:15e6,ts:Date.UTC(2026,1,5,5)}]}
]);
k=totals();
// thu 1200 - chi (300+10+15=325) - dang gui ngoai (100 + 15 = 115) = 760
check('Tien trong TK',k.tienTrongTk,760e6);
check('So du cuoi SO QUY',soDuCuoi(),760e6);
check('Da duyet chua chuyen',k.daDuyetChuaChuyen,40e6);
check('Con duoc tieu',k.conDuocTieu,720e6);

console.log('\n== ymdLocal: khong lui ngay vi mui gio ==');
{
  const d=new Date(2026,8,21,6,30);   // 06:30 sang 21/09 theo gio may
  const got=vm.runInContext('ymdLocal('+d.getTime()+')',ctx);
  const ok=(got==='2026-09-21'); if(!ok) pass=false;
  console.log((ok?'  OK  ':'  SAI ')+'06:30 ngay 21/09 -> '+got);
}

console.log(pass?'\n*** TAT CA DUNG ***':'\n*** CO LOI ***');
process.exit(pass?0:1);
