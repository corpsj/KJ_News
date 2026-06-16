export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://kj-news.vercel.app";

export const SITE_NAME = "광전타임즈";

export const SITE_DESCRIPTION =
  "광전타임즈는 전남 함평 지역을 중심으로 정치, 경제, 사회, 문화 등 지역 밀착 뉴스를 빠르고 정확하게 전합니다.";

export const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph-image`;

export const PRESS_INFO = {
  registrationNumber: "전남, 아00607",
  // 인터넷신문 표시의무(신문법 시행령) — 실제 값으로 채워주세요(예: "2020.01.01").
  // 비어 있으면 푸터에 표시되지 않습니다.
  registrationDate: "", // 등록일자
  foundingDate: "", // 창간일자
  publisher: "선종인",
  editor: "장혁훈",
  // 청소년보호책임자(청소년보호법) — 실제 지정자로 확인/수정하세요. 기본값=편집인.
  youthProtectionOfficer: "장혁훈",
  address: "전남 함평군 함평읍 영수길 148 2층",
  phone: "010-9428-5361",
  fax: "0504-255-5361",
  email: "jebo@kjtimes.co.kr",
  businessNumber: "173-91-02454",
};
