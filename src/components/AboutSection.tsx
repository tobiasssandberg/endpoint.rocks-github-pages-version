import { Github, Linkedin, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AboutSection = () => {
  return (
    <section id="about" className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg border bg-card text-card-foreground p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="h-24 w-24 shrink-0">
              <AvatarImage src="" alt="Tobias Sandberg" />
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
                  href="https://github.com/hillihappo"
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
                  aria-label="Twitter"
                >
                  <Twitter size={20} />
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
