import Section from "./Section";
import EssayGenerator from "./EssayGenerator";
import KTIGenerator from "./KTIGenerator";
import BusinessPlanGenerator from "./BusinessPlanGenerator";
import EssayExchangesGenerator from "./EssayExchangesGenerator";
import InterviewPage from "./InterviewPage";
import BioAnalyzer from "./BioAnalyzer";

const Tools = () => {
  return (
    <Section id="tools" className="bg-n-8 text-n-1">
      <div className="container">
        <h2 className="h2 text-center mb-10">🛠 WebAI Tools Showcase</h2>

        <div className="grid gap-10 md:grid-cols-2">
          <div className="p-6 bg-n-7 rounded-xl border border-n-6">
            <h3 className="h4 mb-4 text-purple-400">Essay Generator</h3>
            <EssayGenerator
              email="guest@webai.ai"
              isPremium={true}
              tokenSisa={99}
              setTokenSisa={() => {}}
              apiUrl="https://webai-production-b975.up.railway.app"
            />
          </div>

          <div className="p-6 bg-n-7 rounded-xl border border-n-6">
            <h3 className="h4 mb-4 text-purple-400">KTI Generator</h3>
            <KTIGenerator
              email="guest@webai.ai"
              isPremium={true}
              tokenSisa={99}
              setTokenSisa={() => {}}
              apiUrl="https://webai-production-b975.up.railway.app"
            />
          </div>

          <div className="p-6 bg-n-7 rounded-xl border border-n-6">
            <h3 className="h4 mb-4 text-purple-400">Business Plan Generator</h3>
            <BusinessPlanGenerator
              email="guest@webai.ai"
              isPremium={true}
              tokenSisa={99}
              setTokenSisa={() => {}}
              apiUrl="https://webai-production-b975.up.railway.app"
            />
          </div>

          <div className="p-6 bg-n-7 rounded-xl border border-n-6">
            <h3 className="h4 mb-4 text-purple-400">Essay Exchanges Generator</h3>
            <EssayExchangesGenerator
              email="guest@webai.ai"
              isPremium={true}
              tokenSisa={99}
              setTokenSisa={() => {}}
              apiUrl="https://webai-production-b975.up.railway.app"
            />
          </div>

          <div className="p-6 bg-n-7 rounded-xl border border-n-6">
            <h3 className="h4 mb-4 text-purple-400">Interview Simulator</h3>
            <InterviewPage
              isPremium={true}
              email="guest@webai.ai"
              tokenSisa={99}
              setTokenSisa={() => {}}
              apiUrl="https://webai-production-b975.up.railway.app"
              onFinish={() => alert("Demo selesai")}
            />
          </div>

          <div className="p-6 bg-n-7 rounded-xl border border-n-6">
            <h3 className="h4 mb-4 text-purple-400">Instagram Bio Analyzer</h3>
            <BioAnalyzer
              isPremium={true}
              email="guest@webai.ai"
              tokenSisa={99}
              setTokenSisa={() => {}}
              apiUrl="https://webai-production-b975.up.railway.app"
            />
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Tools;
