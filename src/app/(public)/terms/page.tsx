export const metadata = {
  title: "이용약관 - 광전타임즈",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">이용약관</h1>

      <div className="space-y-8 text-sm leading-7 text-gray-700">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">제1조 (목적)</h2>
          <p>
            이 약관은 광전타임즈(이하 "회사")가 제공하는 뉴스 및 관련 서비스의 이용과 관련하여 회사와 이용자의 권리,
            의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">제2조 (정의)</h2>
          <p>
            "서비스"란 회사가 제공하는 웹사이트 및 관련 제반 서비스를 말하며, "이용자"란 서비스에 접속하여 본 약관에
            따라 회사가 제공하는 서비스를 이용하는 자를 의미합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">제3조 (약관의 효력 및 변경)</h2>
          <p>
            본 약관은 서비스 화면에 게시하거나 기타의 방법으로 공지함으로써 효력이 발생합니다. 회사는 관련 법령을 위배하지
            않는 범위에서 약관을 개정할 수 있으며, 개정 시 적용일자 및 개정사유를 명시하여 공지합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">제4조 (서비스의 제공 및 변경)</h2>
          <p>
            회사는 뉴스 콘텐츠 제공, 기사 검색, 제보 접수 등 서비스를 제공하며, 운영상 또는 기술상의 필요에 따라 서비스의
            전부 또는 일부를 변경할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">제5조 (이용자의 의무)</h2>
          <p>
            이용자는 관계 법령, 본 약관, 서비스 이용안내 및 회사가 공지한 사항을 준수하여야 하며, 서비스 운영을 방해하는
            행위를 해서는 안 됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">제6조 (저작권 및 콘텐츠 이용)</h2>
          <p>
            서비스 내 게시된 기사, 이미지, 편집물 등의 저작권은 회사 또는 정당한 권리자에게 귀속됩니다. 이용자는 법령에서
            허용되는 범위를 제외하고 회사의 사전 동의 없이 이를 복제, 배포, 전송, 2차적 저작물 작성 등으로 이용할 수
            없습니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">제7조 (면책)</h2>
          <p>
            회사는 천재지변, 불가항력, 이용자의 귀책사유로 인한 서비스 이용 장애에 대하여 책임을 지지 않습니다. 회사는
            외부 링크 또는 제3자가 제공하는 정보의 신뢰성에 대해 보증하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">제8조 (분쟁해결 및 관할)</h2>
          <p>
            서비스 이용과 관련하여 분쟁이 발생한 경우 회사와 이용자는 성실히 협의하여 해결합니다. 협의가 이루어지지 않을
            경우 민사소송법상 관할 법원에 제소할 수 있습니다.
          </p>
        </section>

        <section className="pt-2 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">언론사 정보</h2>
          <ul className="space-y-1 text-gray-600">
            <li>언론사명: 광전타임즈</li>
            <li>주소: 전남 함평군 함평읍 영수길 148 2층</li>
            <li>등록번호: 전남 아00607</li>
            <li>대표·발행인: 선종인</li>
            <li>편집인: 장혁훈</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
