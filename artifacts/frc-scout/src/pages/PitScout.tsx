import { Layout } from "@/components/Layout";

export default function PitScout() {
  return (
    <Layout title="PIT SCOUT" showBack={true}>
      <div className="w-full h-[85vh] rounded-xl overflow-hidden glass-panel border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <iframe
          src="https://forms.gle/JMd5ooEDCv1zkb2z8"
          width="100%"
          height="100%"
          frameBorder="0"
          marginHeight={0}
          marginWidth={0}
          title="Pit Scouting Form"
          className="bg-white/5"
        >
          Loading Google Form...
        </iframe>
      </div>
    </Layout>
  );
}
