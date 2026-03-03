import caseHubLogo from "@/assets/casehub-logo.svg";

export function Footer() {
    return (
        <footer className="w-full rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-lg">
            <div className="px-4 sm:px-6">
                <div className="flex items-center justify-center h-16 gap-3">
                    <img src={caseHubLogo} alt="CaseHub" className="h-6 w-auto" />
                    <span className="text-sm text-muted-foreground">© 2026 CaseHub. Все права защищены.</span>
                </div>
            </div>
        </footer>
    );
}
