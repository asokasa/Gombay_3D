export default function Footer() {
  return (
    <footer className="border-t border-cyan-400/20 bg-[#03050a]/95">
      <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-slate-400">
        &copy; {new Date().getFullYear()} Gombay 3D. All rights reserved. <br /> by: MBM
      </div>
    </footer>
  );
}
