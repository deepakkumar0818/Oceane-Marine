import GoToDashBoardButton from "../components/GoToDashBoardButton";
export const metadata = {
  title: "QHSE | STS Management",
};

export default function QhseLayout({ children }) {
  return (
    <div className="relative min-h-screen bg-transparent text-white pt-6">
      <GoToDashBoardButton offsetLeftPx={316} />
      {children}
    </div>
  );
}

