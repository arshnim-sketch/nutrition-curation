/**
 * 영양제 큐레이션 데이터 수집용 Google Apps Script
 * 
 * [설정 방법]
 * 1. Google Sheets 새 스프레드시트 생성: https://sheets.new
 * 2. 확장 프로그램 > Apps Script 클릭
 * 3. 이 코드를 전체 복사하여 붙여넣기
 * 4. 배포 > 새 배포 > 유형: 웹 앱
 *    - 실행 사용자: 본인
 *    - 접근 권한: 모든 사용자
 * 5. 배포 후 생성된 URL을 .env 파일의 VITE_GOOGLE_SHEETS_URL에 입력
 */

function doPost(e) {
  try {
    var doc = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/1snY5bFW2cAlguPMi9L05w5zjWMDE0M7UETZ4kNyAKrM/edit");
    var sheet = doc.getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // 헤더가 없으면 추가
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        '기록일시',
        '이름',
        '나이',
        '성별',
        '선택 증상',
        '추천 세트명',
        '추천 영양제',
        '각 영양제 가격',
        '총 가격',
        'AI 분석 요약',
        '영양소 균형 상태',
        '상호작용 주의사항'
      ]);
      // 헤더 스타일링
      var headerRange = sheet.getRange(1, 1, 1, 12);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#111111');
      headerRange.setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }

    // 데이터 행 추가
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name || '',
      data.age || '',
      data.gender === 'male' ? '남성' : '여성',
      data.symptoms || '',
      data.setName || '',
      data.products || '',
      data.prices || '',
      data.totalPrice || '',
      data.summary || '',
      data.nutrientStatus || '',
      data.interactions || ''
    ]);

    // 열 너비 자동 조정 (첫 50행 기준)
    if (sheet.getLastRow() === 2) {
      sheet.setColumnWidth(1, 160);  // 기록일시
      sheet.setColumnWidth(2, 80);   // 이름
      sheet.setColumnWidth(3, 50);   // 나이
      sheet.setColumnWidth(4, 60);   // 성별
      sheet.setColumnWidth(5, 250);  // 증상
      sheet.setColumnWidth(6, 150);  // 세트명
      sheet.setColumnWidth(7, 300);  // 추천 영양제
      sheet.setColumnWidth(8, 200);  // 가격
      sheet.setColumnWidth(9, 100);  // 총 가격
      sheet.setColumnWidth(10, 400); // AI 요약
      sheet.setColumnWidth(11, 300); // 영양소 균형
      sheet.setColumnWidth(12, 300); // 상호작용
    }

    return ContentService.createTextOutput(
      JSON.stringify({ status: 'success', row: sheet.getLastRow() })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// GET 요청 처리 (테스트용)
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok', message: '영양제 큐레이션 데이터 수집 API가 작동 중입니다.' })
  ).setMimeType(ContentService.MimeType.JSON);
}
