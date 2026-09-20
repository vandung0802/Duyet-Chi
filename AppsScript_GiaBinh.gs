// ══════════════════════════════════════════════════════════════
//  APPS SCRIPT cho SỔ QUỸ GIA BÌNH  (sheet "Sổ Quỹ Gia Bình")
//  Dán vào Tiện ích mở rộng → Apps Script của ĐÚNG sheet Gia Bình,
//  rồi Triển khai → Ứng dụng web → Bất kỳ ai → dán URL vào app.
//  Khác bản 379: bỏ sheet "Chi Kế hoạch", thêm sheet "Thu & Ký quỹ".
// ══════════════════════════════════════════════════════════════
function onOpen(){SpreadsheetApp.getUi().createMenu('📋 Sổ Quỹ Gia Bình').addItem('🔗 Mở App','openApp').addToUi();}
function openApp(){var html=HtmlService.createHtmlOutput('<div style="font-family:Arial;padding:20px;text-align:center"><a href="https://vandung0802.github.io/Duyet-Chi/giabinh.html" target="_blank" style="background:#047857;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:bold">👉 Mở Sổ Quỹ Gia Bình</a></div>').setWidth(350).setHeight(100);SpreadsheetApp.getUi().showModalDialog(html,'Sổ Quỹ Gia Bình');}
var HEADERS=['STT','ID','Thời gian tạo','Nội dung','Người đề xuất','Công trường','Số tiền ĐX','Ghi chú','D duyệt - lịch sử','H duyệt - lịch sử','Trạng thái','Lý do từ chối','Ngày cập nhật','D tổng duyệt','H tổng duyệt','Tổng đã chuyển','T chuyển - lịch sử','Số tiền duyệt chính thức'];
function getMainSheet(ss){
  var sh=ss.getSheetByName('Tổng hợp đề xuất')||ss.getSheetByName('Đề xuất');
  if(!sh){ sh=ss.insertSheet('Tổng hợp đề xuất'); }
  else if(sh.getName()!=='Tổng hợp đề xuất'){ sh.setName('Tổng hợp đề xuất'); }
  if(sh.getLastRow()===0){
    sh.appendRow(HEADERS);
  } else if(sh.getRange(1,1).getValue()!=='STT'){
    sh.insertColumnBefore(1); sh.getRange(1,1).setValue('STT');
  }
  for(var c=0;c<HEADERS.length;c++){ if(sh.getRange(1,c+1).getValue()!==HEADERS[c]) sh.getRange(1,c+1).setValue(HEADERS[c]); }
  // Style CƠ BẢN: chỉ đặt 1 lần (đánh dấu bằng metadata) → sau đó user tự chỉnh header/độ rộng, app KHÔNG đè
  try{
    var styled=false, dm=sh.getDeveloperMetadata();
    for(var mi=0;mi<dm.length;mi++){ if(dm[mi].getKey()==='dcStyled'){ styled=true; break; } }
    if(!styled){
      sh.getRange(1,1,1,HEADERS.length).setFontWeight('bold').setBackground('#1a56db').setFontColor('#fff').setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
      sh.setRowHeight(1,36); sh.setFrozenRows(1); sh.setFrozenColumns(1);
      try{ sh.hideColumns(2); }catch(e2){}
      sh.setColumnWidth(1,46);sh.setColumnWidth(4,240);sh.setColumnWidth(9,240);sh.setColumnWidth(10,240);sh.setColumnWidth(17,240);
      sh.addDeveloperMetadata('dcStyled','1');
    }
  }catch(e){ sh.getRange(1,1,1,HEADERS.length).setFontWeight('bold').setBackground('#1a56db').setFontColor('#fff'); }
  [7,14,15,16,18].forEach(function(cc){ sh.getRange(2,cc,Math.max(1,sh.getMaxRows()-1),1).setNumberFormat('#,##0" đ"'); });
  return sh;
}
// Style THEO NỘI DUNG cho bảng chính (căn lề + viền + sọc xen kẽ) — bọc try/catch để không bao giờ làm hỏng đồng bộ
function _styleMain(sh){
  try{
    var lr=sh.getLastRow(), mc=sh.getLastColumn(); if(lr<2) return;
    var mn=lr-1;
    sh.getRange(2,1,mn,1).setHorizontalAlignment('center');
    [7,14,15,16,18].forEach(function(cc){ if(cc<=mc) sh.getRange(2,cc,mn,1).setHorizontalAlignment('right'); });
    sh.getRange(1,1,lr,mc).setBorder(true,true,true,true,true,true,'#c7d2fe',SpreadsheetApp.BorderStyle.SOLID);
    var bs=sh.getBandings(), br=sh.getRange(2,1,mn,mc);
    if(bs.length>0){ bs[0].setRange(br); } else { br.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY,false,false); }
  }catch(e){}
}
function num_(x){ var n=parseFloat(String(x).replace(/[^0-9.]/g,'')); return isNaN(n)?0:n; }
function doGet(e){
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var sh=getMainSheet(ss);
  var v=sh.getDataRange().getValues();
  var targetId=String(e.parameter.id||'');
  var rowIdx=-1;
  for(var i=1;i<v.length;i++){ if(String(v[i][1])===targetId){ rowIdx=i+1; break; } }
  var now=new Date().toLocaleString('vi-VN');
  var act=e.parameter.action;
  if(act==='add'){
    sh.appendRow(['', "'"+e.parameter.id, e.parameter.ts, e.parameter.desc, e.parameter.person, e.parameter.site, e.parameter.amount, e.parameter.note, '', '', 'Chờ duyệt', '', '', '', '', '', '', '']);
  } else if(act==='upsertFull'){
    // v144: ghi-hoặc-cập-nhật CẢ DÒNG theo id (không trùng, tự vá dòng thiếu). Dùng cho nút "Đồng bộ lại phiếu chi".
    var fv=['', "'"+e.parameter.id, e.parameter.ts||'', e.parameter.desc||'', e.parameter.person||'', e.parameter.site||'', e.parameter.amount||'', e.parameter.note||'', e.parameter.dHistory||'', e.parameter.hHistory||'', e.parameter.status||'Chờ duyệt', e.parameter.rejectedBy||'', now, e.parameter.dAmount||'', e.parameter.hAmount||'', e.parameter.totalTransferred||'', e.parameter.history||'', e.parameter.officialAmount||''];
    if(rowIdx>0){ sh.getRange(rowIdx,1,1,18).setValues([fv]); } else { sh.appendRow(fv); }
    if(e.parameter.skipReport==='1'){ return ContentService.createTextOutput('ok'); } // bỏ dựng báo cáo mỗi dòng cho nhanh; cuối cùng gọi resyncReport 1 lần
  } else if(act==='resyncReport'){
    // v144: không đổi dữ liệu, chỉ rơi xuống cuối để sort + đánh STT + dựng lại báo cáo 1 lần (sau khi bulk upsertFull)
  } else if(act==='updateStatus'){
    if(rowIdx>0){ sh.getRange(rowIdx,11).setValue(e.parameter.status); sh.getRange(rowIdx,13).setValue(now); }
  } else if(act==='updateApproval'){
    if(rowIdx>0){ sh.getRange(rowIdx, e.parameter.field==='D'?9:10).setValue(e.parameter.time||''); sh.getRange(rowIdx,13).setValue(now); }
  } else if(act==='updateApprovalAmount'){
    if(rowIdx>0){
      if(e.parameter.dHistory!==undefined) sh.getRange(rowIdx,9).setValue(e.parameter.dHistory||'');
      if(e.parameter.hHistory!==undefined) sh.getRange(rowIdx,10).setValue(e.parameter.hHistory||'');
      sh.getRange(rowIdx,14).setValue(e.parameter.dAmount||'');
      sh.getRange(rowIdx,15).setValue(e.parameter.hAmount||'');
      sh.getRange(rowIdx,18).setValue(e.parameter.officialAmount||'');
      sh.getRange(rowIdx,13).setValue(now);
    }
  } else if(act==='updateTransfer'){
    if(rowIdx>0){ sh.getRange(rowIdx,16).setValue(e.parameter.totalTransferred||''); sh.getRange(rowIdx,17).setValue(e.parameter.history||''); sh.getRange(rowIdx,13).setValue(now); }
  } else if(act==='updateRejectedBy'){
    if(rowIdx>0){ sh.getRange(rowIdx,12).setValue(e.parameter.rejectedBy||''); sh.getRange(rowIdx,13).setValue(now); }
  } else if(act==='edit'){
    if(rowIdx>0){
      sh.getRange(rowIdx,4).setValue(e.parameter.desc||'');
      sh.getRange(rowIdx,5).setValue(e.parameter.person||'');
      sh.getRange(rowIdx,6).setValue(e.parameter.site||'');
      sh.getRange(rowIdx,7).setValue(e.parameter.amount||'');
      sh.getRange(rowIdx,8).setValue(e.parameter.note||'');
      sh.getRange(rowIdx,13).setValue(now);
    }
  } else if(act==='delete'){
    if(rowIdx>0) sh.deleteRow(rowIdx);
  } else if(act==='luong'){
    var ls=ss.getSheetByName('Tổng hợp Lương')||ss.insertSheet('Tổng hợp Lương');
    if(ls.getLastRow()===0){
      // ── Style CƠ BẢN: chỉ đặt 1 lần khi tạo mới → sau đó người dùng tự đổi thoải mái (app không ghi đè) ──
      ls.appendRow(['STT','ID','Tháng','Nhân viên','Chức vụ','Nhóm','Đề xuất','D duyệt','H duyệt','Đã chuyển','Còn lại','Trạng thái','Người ĐX','Ngày CN']);
      ls.getRange(1,1,1,14).setFontWeight('bold').setBackground('#16a34a').setFontColor('#fff').setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
      ls.setRowHeight(1,36);
      ls.setFrozenRows(1); ls.setFrozenColumns(1);
      ls.hideColumns(2);
      var LW=[46,0,86,150,120,170,112,112,112,112,112,108,120,140];
      for(var wi=0;wi<LW.length;wi++){ if(LW[wi]>0) ls.setColumnWidth(wi+1,LW[wi]); }
    }
    var lv=ls.getDataRange().getValues(); var lrow=-1;
    for(var li=1;li<lv.length;li++){ if(String(lv[li][1])===targetId){ lrow=li+1; break; } }
    var vals=['', "'"+targetId, e.parameter.month||'', e.parameter.emp||'', e.parameter.pos||'', e.parameter.grp||'', num_(e.parameter.amount), num_(e.parameter.d), num_(e.parameter.h), num_(e.parameter.ck), num_(e.parameter.conlai), e.parameter.st||'', e.parameter.by||'', now];
    if(lrow>0){ ls.getRange(lrow,1,1,14).setValues([vals]); } else { ls.appendRow(vals); }
    var llr=ls.getLastRow();
    if(llr>=3) ls.getRange(2,1,llr-1,14).sort([{column:3,ascending:false},{column:4,ascending:true}]);
    if(llr>=2){ var s2=[]; for(var kk=1;kk<=llr-1;kk++) s2.push([kk]); ls.getRange(2,1,llr-1,1).setValues(s2); }
    // ── Style THEO NỘI DUNG: chạy mỗi lần để bảng luôn gọn khi thêm dòng (không đụng độ rộng/màu tiêu đề/cột thêm) ──
    if(llr>=2){
      var ln=llr-1;
      for(var cc=7;cc<=11;cc++){ ls.getRange(2,cc,ln,1).setNumberFormat('#,##0" đ"'); }
      ls.getRange(2,1,ln,1).setHorizontalAlignment('center');   // STT
      ls.getRange(2,3,ln,1).setHorizontalAlignment('center');   // Tháng
      ls.getRange(2,7,ln,5).setHorizontalAlignment('right');    // các cột tiền
      ls.getRange(2,12,ln,1).setHorizontalAlignment('center');  // Trạng thái
      ls.getRange(1,1,llr,14).setBorder(true,true,true,true,true,true,'#a5d6a7',SpreadsheetApp.BorderStyle.SOLID);
      // Sọc xen kẽ: nếu người dùng đã tự đặt màu → chỉ nới vùng cho khớp số dòng (GIỮ màu họ chọn); chưa có thì đặt mặc định
      var lbs=ls.getBandings(); var lbr=ls.getRange(2,1,ln,14);
      if(lbs.length>0){ lbs[0].setRange(lbr); } else { lbr.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREEN,false,false); }
    }
    return ContentService.createTextOutput('ok');
  } else if(act==='luongDel'){
    var ls2=ss.getSheetByName('Tổng hợp Lương');
    if(ls2){ var lv2=ls2.getDataRange().getValues(); for(var lj=lv2.length-1;lj>=1;lj--){ if(String(lv2[lj][1])===targetId){ ls2.deleteRow(lj+1); break; } } }
    return ContentService.createTextOutput('ok');
  } else if(act==='cash'){
    // ── SỔ QUỸ GIA BÌNH: sheet "Thu & Ký quỹ" — upsert theo id (thay chỗ P.Kế hoạch của app 379) ──
    var cs=ss.getSheetByName('Thu & Ký quỹ')||ss.insertSheet('Thu & Ký quỹ');
    if(cs.getLastRow()===0){
      cs.appendRow(['STT','ID','Ngày','Loại','Nội dung','Nguồn / Nơi giữ','Số tiền','Đã lấy về','Còn treo','Người ghi','Ngày CN']);
      cs.getRange(1,1,1,11).setFontWeight('bold').setBackground('#047857').setFontColor('#fff').setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
      cs.setRowHeight(1,36); cs.setFrozenRows(1); cs.setFrozenColumns(1);
      cs.hideColumns(2);
      var CW=[46,0,100,110,240,170,130,130,130,110,140];
      for(var cwi=0;cwi<CW.length;cwi++){ if(CW[cwi]>0) cs.setColumnWidth(cwi+1,CW[cwi]); }
    }
    var cv=cs.getDataRange().getValues(); var crow=-1;
    for(var ci=1;ci<cv.length;ci++){ if(String(cv[ci][1])===targetId){ crow=ci+1; break; } }
    var cvals=['', "'"+targetId, e.parameter.date||'', e.parameter.loai||'', e.parameter.desc||'', e.parameter.src||'',
               num_(e.parameter.amount), num_(e.parameter.back), num_(e.parameter.left), e.parameter.by||'', now];
    if(crow>0){ cs.getRange(crow,1,1,11).setValues([cvals]); } else { cs.appendRow(cvals); }
    var clr=cs.getLastRow();
    if(clr>=3) cs.getRange(2,1,clr-1,11).sort([{column:3,ascending:false}]); // theo NGÀY, mới nhất lên đầu
    if(clr>=2){ var cst=[]; for(var ck2=1;ck2<=clr-1;ck2++) cst.push([ck2]); cs.getRange(2,1,clr-1,1).setValues(cst); }
    if(clr>=2){
      var cn=clr-1;
      for(var cc=7;cc<=9;cc++){ cs.getRange(2,cc,cn,1).setNumberFormat('#,##0" đ"'); }
      cs.getRange(2,1,cn,1).setHorizontalAlignment('center');
      cs.getRange(2,4,cn,1).setHorizontalAlignment('center');
      cs.getRange(2,7,cn,3).setHorizontalAlignment('right');
      cs.getRange(1,1,clr,11).setBorder(true,true,true,true,true,true,'#a7f3d0',SpreadsheetApp.BorderStyle.SOLID);
      var cbs=cs.getBandings(); var cbr=cs.getRange(2,1,cn,11);
      if(cbs.length>0){ cbs[0].setRange(cbr); } else { cbr.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY,false,false); }
    }
    return ContentService.createTextOutput('ok');
  } else if(act==='cashDel'){
    var cs3=ss.getSheetByName('Thu & Ký quỹ');
    if(cs3){ var cv3=cs3.getDataRange().getValues(); for(var cj=cv3.length-1;cj>=1;cj--){ if(String(cv3[cj][1])===targetId){ cs3.deleteRow(cj+1); break; } } }
    return ContentService.createTextOutput('ok');
  } else if(act==='reconcile'){
    var keep={}, cnt=0;
    String(e.parameter.ids||'').split(',').forEach(function(x){ x=x.trim(); if(x){ keep[x]=1; cnt++; } });
    var total=parseInt(e.parameter.total||'0',10);
    if(cnt>0 && total>0 && cnt>=total-1){
      for(var r=v.length-1;r>=1;r--){ var id2=String(v[r][1]); if(id2 && !keep[id2]) sh.deleteRow(r+1); }
    }
  }
  var lr=sh.getLastRow();
  if(lr>=3){ sh.getRange(2,1,lr-1,sh.getLastColumn()).sort({column:2, ascending:false}); }
  if(lr>=2){ var stt=[]; for(var k=1;k<=lr-1;k++) stt.push([k]); sh.getRange(2,1,lr-1,1).setValues(stt); }
  _styleMain(sh);
  buildReports(ss, sh);
  return ContentService.createTextOutput('ok');
}
function buildReports(ss, sh){
  var data=sh.getDataRange().getValues();
  var rows=data.slice(1);
  var official=function(r){ var o=num_(r[17]); if(o>0) return o; var h=num_(r[14]); return h>0?h:num_(r[13]); };
  var trans=function(r){ return num_(r[15]); };
  var isRej=function(r){ return String(r[10]).indexOf('Từ chối')>=0; };
  var daChuyen=rows.filter(function(r){ return trans(r)>0.001; });
  var chuaChuyen=rows.filter(function(r){ return !isRej(r) && official(r)>0 && (official(r)-trans(r))>0.001; });
  var tuChoi=rows.filter(function(r){ return isRej(r); });
  var choDuyet=rows.filter(function(r){ return !isRej(r) && official(r)<=0 && trans(r)<=0.001; });
  writeReport_(ss,'Đã chuyển',['STT','Nội dung','Người','Công trường','Đã chuyển','Còn phải chuyển','Ngày CN'],'#16a34a',
    daChuyen.map(function(r,i){ return [i+1, r[3], r[4], r[5], trans(r), Math.max(0,official(r)-trans(r)), r[12]]; }));
  writeReport_(ss,'Chưa chuyển',['STT','Nội dung','Người','Công trường','Số duyệt','Còn phải chuyển','Ngày CN'],'#d97706',
    chuaChuyen.map(function(r,i){ return [i+1, r[3], r[4], r[5], official(r), official(r)-trans(r), r[12]]; }));
  writeReport_(ss,'Từ chối',['STT','Nội dung','Người','Công trường','Số tiền ĐX','Lý do từ chối','Ngày CN'],'#dc2626',
    tuChoi.map(function(r,i){ return [i+1, r[3], r[4], r[5], num_(r[6]), r[11], r[12]]; }));
  writeReport_(ss,'Chờ duyệt',['STT','Nội dung','Người','Công trường','Số tiền ĐX','Ghi chú','Ngày CN'],'#9333ea',
    choDuyet.map(function(r,i){ return [i+1, r[3], r[4], r[5], num_(r[6]), r[7], r[12]]; }));
}
function writeReport_(ss, name, headers, color, rows){
  var s=ss.getSheetByName(name)||ss.insertSheet(name);
  s.clear();
  try{ var obs=s.getBandings(); for(var ob=0;ob<obs.length;ob++) obs[ob].remove(); }catch(e){}
  s.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold').setBackground(color).setFontColor('#fff').setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  s.setRowHeight(1,34);
  if(rows.length){ s.getRange(2,1,rows.length,headers.length).setValues(rows); }
  // Style (bảng báo cáo tự tạo lại mỗi lần) — bọc try/catch để không làm hỏng đồng bộ
  try{
    if(rows.length){
      s.getRange(2,5,rows.length,2).setNumberFormat('#,##0" đ"');
      s.getRange(2,1,rows.length,1).setHorizontalAlignment('center');
      s.getRange(2,5,rows.length,1).setHorizontalAlignment('right');
      s.getRange(1,1,rows.length+1,headers.length).setBorder(true,true,true,true,true,true,'#d1d5db',SpreadsheetApp.BorderStyle.SOLID);
      s.getRange(2,1,rows.length,headers.length).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY,false,false);
    }
  }catch(e){}
  s.setColumnWidth(1,46); s.setColumnWidth(2,240); s.setColumnWidth(3,150); s.setColumnWidth(4,150);
  s.setColumnWidth(5,120); s.setColumnWidth(6,140); s.setColumnWidth(7,130);
  s.setFrozenRows(1);
}