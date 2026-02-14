import { type VariantProps } from "class-variance-authority";
import { ArrowRightIcon } from "lucide-react";
import { ReactNode } from "react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

import Github from "../../logos/github";
import { Badge } from "../../ui/badge";
import { Button, buttonVariants } from "../../ui/button";
import Glow from "../../ui/glow";
import HeroSphere from "../../ui/hero-sphere";
import { Mockup, MockupFrame } from "../../ui/mockup";
import Screenshot from "../../ui/screenshot";
import { Section } from "../../ui/section";

interface HeroButtonProps {
  href: string;
  text: string;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  icon?: ReactNode;
  iconRight?: ReactNode;
}

interface HeroProps {
  title?: string;
  description?: string;
  mockup?: ReactNode | false;
  badge?: ReactNode | false;
  buttons?: HeroButtonProps[] | false;
  className?: string;
}

export default function Hero({
  title = "Welcome to the future of\nCloud Rendering",
  description = "Only pay for what you use, we don't overcharge for our systems running and burning electricity. Simple, transparent and beautiful while providing the best in class speed and hardware.",
  mockup = (
    <Screenshot
      srcLight="/dashboard-light.png"
      srcDark="/appScreenshotCut.png"
      alt="Launch UI app screenshot"
      width={1248}
      height={765}
      className="w-full"
    />
  ),
  badge = false,
  buttons = [
    {
      href: siteConfig.getStartedUrl,
      text: "Get Started",
      variant: "default",
    },
    {
      href: siteConfig.links.github,
      text: "Github",
      variant: "glow",
      icon: <Github className="mr-2 size-4" />,
    },
  ],
  className,
}: HeroProps) {
  return (
    <Section
      className={cn(
        "fade-bottom overflow-hidden pb-0 sm:pb-0 md:pb-0",
        className,
      )}
    >
      <div className="max-w-container mx-auto flex flex-col gap-8 pt-4 sm:gap-16">
        <div className="relative flex flex-col items-center gap-6 text-center sm:gap-12">
          <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-screen">
            <HeroSphere />
          </div>
          {badge !== false && badge}
          <h1 className="animate-appear from-white to-white dark:to-white/90 relative z-10 inline-block bg-linear-to-r bg-clip-text text-2xl leading-tight font-semibold text-balance text-transparent drop-shadow-2xl sm:text-4xl sm:leading-tight md:text-6xl md:leading-tight">
            <span className="block">Welcome to the future of</span>
            <span className="block">Cloud Rendering</span>
          </h1>
          <p className="text-md animate-appear text-white/75 dark:text-white/75 relative z-10 max-w-[1000px] font-medium text-balance opacity-0 delay-100 sm:text-xl">
            {description}
            <br />
            <span className="from-foreground to-brand bg-linear-to-r bg-clip-text font-semibold text-transparent drop-shadow-[2px_1px_24px_var(--brand-foreground)]">
              No BS. No Cap.
            </span>
          </p>
          {buttons !== false && buttons.length > 0 && (
            <div className="animate-appear relative z-10 flex justify-center gap-4 opacity-0 delay-300">
              {buttons.map((button, index) => (
                <Button
                  key={index}
                  variant={button.variant || "default"}
                  size="lg"
                  asChild
                >
                  <a href={button.href}>
                    {button.icon}
                    {button.text}
                    {button.iconRight}
                  </a>
                </Button>
              ))}
            </div>
          )}
          {mockup !== false && (
            <div className="relative w-full pt-12">
              <MockupFrame
                className="animate-appear opacity-0 delay-700"
                size="small"
              >
                <Mockup
                  type="responsive"
                  className="bg-background/90 w-full rounded-xl border-0"
                >
                  {mockup}
                </Mockup>
              </MockupFrame>
              <Glow
                variant="top"
                className="animate-appear-zoom opacity-0 delay-1000"
              />
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
