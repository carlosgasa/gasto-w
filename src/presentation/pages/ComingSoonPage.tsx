import { Icon, type IconName } from "../icons/Icon";
import "./pages.css";

interface ComingSoonPageProps {
  title: string;
  description: string;
  icon: IconName;
}

export function ComingSoonPage({ title, description, icon }: ComingSoonPageProps) {
  return (
    <div>
      <div className="page-header">
        <h1>{title}</h1>
      </div>
      <div className="card coming-soon">
        <Icon name={icon} size={28} />
        <p>{description}</p>
      </div>
    </div>
  );
}
