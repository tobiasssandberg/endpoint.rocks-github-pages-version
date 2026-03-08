import { Github, Linkedin, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AboutSection = () => {
  return (
    <section id="about" className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg border bg-card text-card-foreground p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="h-24 w-24 shrink-0">
              <AvatarImage src="" alt="Profile" />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                EP
              </AvatarFallback>
            </Avatar>

            <div className="text-center sm:text-left space-y-3">
              <h2 className="text-2xl font-bold text-foreground">About Me</h2>
              <p className="text-muted-foreground leading-relaxed">
                I'm a tech enthusiast who loves exploring and curating the best AI tools and resources.
                Here on Endpoint.rocks I share tools, guides, and thoughts on AI and automation.
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="GitHub"
                >
                  <Github size={20} />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={20} />
                </a>
                <a
                  href="mailto:hello@endpoint.rocks"
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
