import { Link, useLocation } from "wouter";
import { Home, BookOpen, Gamepad2, Library, User } from "lucide-react";

type NavigationProps = {
  activeSection: string;
};

const Navigation = ({ activeSection }: NavigationProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex justify-around py-2 z-10">
      <NavItem 
        icon={<Home className="h-5 w-5" />} 
        label="Головна" 
        target="/home" 
        isActive={activeSection === "home"} 
      />
      <NavItem 
        icon={<BookOpen className="h-5 w-5" />} 
        label="Теорія" 
        target="/theory" 
        isActive={activeSection === "theory"} 
      />
      <NavItem 
        icon={<Gamepad2 className="h-5 w-5" />} 
        label="Ігри" 
        target="/games" 
        isActive={activeSection === "games"} 
      />
      <NavItem 
        icon={<Library className="h-5 w-5" />} 
        label="Бібліотека" 
        target="/library" 
        isActive={activeSection === "library"} 
      />
      <NavItem 
        icon={<User className="h-5 w-5" />} 
        label="Профіль" 
        target="/profile" 
        isActive={activeSection === "profile"} 
      />
    </nav>
  );
};

type NavItemProps = {
  icon: React.ReactNode;
  label: string;
  target: string;
  isActive: boolean;
};

const NavItem = ({ icon, label, target, isActive }: NavItemProps) => {
  return (
    <Link href={target}>
      <div 
        className={`flex flex-col items-center pt-1 pb-1 px-3 cursor-pointer ${isActive ? 'text-primary' : 'text-neutral-400'}`}
      >
        {icon}
        <span className="text-xs mt-1">{label}</span>
      </div>
    </Link>
  );
};

export default Navigation;
