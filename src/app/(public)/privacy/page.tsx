export const metadata = {
  title: "개인정보처리방침 - 광전타임즈",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">개인정보처리방침</h1>

      <div className="space-y-8 text-sm leading-7 text-gray-700">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">1. 총칙</h2>
          <p>
            광전타임즈(이하 "회사")는 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 등 관련 법령을 준수합니다.
            회사는 개인정보처리방침을 통해 수집하는 개인정보의 항목, 이용목적, 보관기간 및 보호조치를 안내합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">2. 수집하는 개인정보 항목</h2>
          <p>
            회사는 제보, 문의, 뉴스레터 신청 등 서비스 제공 과정에서 이름, 이메일, 연락처, 접속 로그(IP, 브라우저 정보,
            방문기록) 등을 수집할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">3. 개인정보의 이용 목적</h2>
          <p>
            수집한 개인정보는 이용자 식별, 문의 응대, 제보 처리, 서비스 품질 개선, 부정 이용 방지 및 법령 준수를 위해
            이용됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">4. 개인정보의 보유 및 이용기간</h2>
          <p>
            개인정보는 수집·이용 목적이 달성된 후 지체 없이 파기하는 것을 원칙으로 합니다. 단, 관련 법령에 따라 보존이
            필요한 경우 해당 기간 동안 안전하게 보관합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">5. 개인정보의 제3자 제공</h2>
          <p>
            회사는 이용자의 동의가 있거나 법령에 특별한 규정이 있는 경우를 제외하고 개인정보를 제3자에게 제공하지
            않습니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">6. 개인정보 처리의 위탁</h2>
          <p>
            회사는 원활한 서비스 제공을 위해 필요한 경우 개인정보 처리 업무를 외부에 위탁할 수 있으며, 위탁 시 관련 법령에
            따라 수탁자를 관리·감독합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">7. 정보주체의 권리</h2>
          <p>
            이용자는 언제든지 개인정보 열람, 정정, 삭제, 처리정지 등을 요청할 수 있으며, 회사는 관련 법령에 따라 지체 없이
            조치합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">8. 개인정보의 파기절차 및 방법</h2>
          <p>
            보유기간 경과 또는 처리목적 달성 시 전자적 파일은 복구 불가능한 방법으로 삭제하고, 종이 문서는 분쇄 또는 소각
            방식으로 파기합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">9. 개인정보 보호책임자</h2>
          <ul className="space-y-1 text-gray-600">
            <li>언론사명: 광전타임즈</li>
            <li>주소: 전남 함평군 함평읍 영수길 148 2층</li>
            <li>등록번호: 전남 아00607</li>
            <li>대표·발행인: 선종인</li>
            <li>편집인: 장혁훈</li>
            <li>사업자등록번호: 173-91-02454</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
