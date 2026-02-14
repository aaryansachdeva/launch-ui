import { Terminal } from "lucide-react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Section } from "../../ui/section";

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11" />
    </svg>
  );
}


interface PlatformProps {
  name: string;
  icon: React.ReactNode;
  href: string;
  description: string;
}

interface DownloadProps {
  title?: string;
  description?: string;
  platforms?: PlatformProps[];
  className?: string;
}

export default function Download({
  title = "Download for your platform",
  description = "Get started with fotonRender on your preferred operating system.",
  platforms = [
    {
      name: "Windows",
      icon: <WindowsIcon className="size-8" />,
      href: "#",
      description: "Windows 10+",
    },
    {
      name: "macOS",
      icon: <AppleIcon className="size-10" />,
      href: "#",
      description: "macOS 12+",
    },
    {
      name: "Linux",
      icon: <Terminal className="size-8" />,
      href: "#",
      description: "Ubuntu, Fedora, Arch",
    },
  ],
  className,
}: DownloadProps) {
  return (
    <Section id="download" className={cn(className)}>
      <div className="max-w-container mx-auto flex flex-col items-center gap-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <Badge variant="outline" className="border-brand/30 text-brand">
            Last Changed: {siteConfig.stats.updated}
          </Badge>
          <h2 className="text-2xl font-semibold sm:text-4xl">{title}</h2>
          <p className="text-muted-foreground max-w-[600px] text-balance sm:text-lg">
            {description}
          </p>
        </div>
        <div className="grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
          {platforms.map((platform) => (
            <a
              key={platform.name}
              href={platform.href}
              className="glass-2 hover:glass-3 group flex h-full flex-col items-center rounded-xl p-8 transition-all duration-200"
            >
              <div className="flex h-12 items-center justify-center text-brand transition-transform duration-200 group-hover:scale-110">
                {platform.icon}
              </div>
              <div className="mt-4 flex flex-col items-center gap-1">
                <span className="text-lg font-semibold">{platform.name}</span>
                <span className="text-muted-foreground text-sm">
                  {platform.description}
                </span>
              </div>
              <Button variant="default" size="lg" className="mt-6 w-full">
                Download
              </Button>
            </a>
          ))}
        </div>
      </div>
    </Section>
  );
}
