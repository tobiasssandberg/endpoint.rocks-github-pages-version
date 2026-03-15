import { Github, Linkedin, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AboutSection = () => {
  return (
    <section id="about" className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg border bg-card text-card-foreground p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="h-24 w-24 shrink-0">
              <AvatarImage src="https://avatars.githubusercontent.com/u/43400481?v=4" alt="Tobias Sandberg" />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                TS
              </AvatarFallback>
            </Avatar>

            <div className="text-center sm:text-left space-y-3">
              <h2 className="text-2xl font-bold text-foreground">Tobias Sandberg</h2>
              <p className="text-muted-foreground leading-relaxed">
                Principal Engineer at Xenit AB in Gothenburg, Sweden. Passionate about Microsoft Intune, automation and sharing useful resources here on Endpoint.rocks.
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
                <a
                  href="https://github.com/tobiasssandberg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="GitHub"
                >
                  <Github size={20} />
                </a>
                <a
                  href="https://se.linkedin.com/in/tobias-sandberg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={20} />
                </a>
                <a
                  href="https://x.com/Hillihappo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="X"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="mailto:tobias.sandberg@xenit.se"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Email"
                >
                  <Mail size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
