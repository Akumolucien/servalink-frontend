function Doc({ title }: { title: string }) {
  return <div className="system-page"><h1>{title}</h1><p>This page is being prepared and will be published before SERVAlink launches.</p></div>;
}
export const HelpPage = () => <Doc title="Help & Contact" />;
export const PrivacyPage = () => <Doc title="Privacy Policy" />;
export const TermsPage = () => <Doc title="Terms of Service" />;
