import type { AppId } from "@/lib/api";
import { appList } from "@/apps/registry";
import { ProviderIcon } from "@/components/ProviderIcon";

interface AppSwitcherProps {
  activeApp: AppId;
  onSwitch: (app: AppId) => void;
}

export function AppSwitcher({ activeApp, onSwitch }: AppSwitcherProps) {
  const handleSwitch = (app: AppId) => {
    if (app === activeApp) return;
    onSwitch(app);
  };
  const iconSize = 20;

  return (
    <div className="inline-flex bg-muted rounded-xl p-1 gap-1">
      {appList.map((app) => {
        const isActive = activeApp === app.id;
        return (
          <button
            key={app.id}
            type="button"
            onClick={() => handleSwitch(app.id)}
            className={`group inline-flex items-center gap-2 px-3 h-8 rounded-md text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <ProviderIcon
              icon={app.icon}
              name={app.label}
              size={iconSize}
              className={
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground group-hover:text-foreground transition-colors"
              }
            />
            <span>{app.label}</span>
          </button>
        );
      })}
    </div>
  );
}
