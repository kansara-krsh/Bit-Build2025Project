import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="relative min-h-screen w-full">
      {/* Navigation */}
      <Navbar />
      
      {/* Main content */}
      <main>
        {children}
      </main>
    </div>
  );
}