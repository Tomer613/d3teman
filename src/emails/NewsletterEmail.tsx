import { Body, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text } from "@react-email/components";
import { COMMUNITY_NAME, COMMUNITY_ADDRESS_LINE, LOGO_INITIAL } from "@/lib/branding";

export interface NewsletterEmailItem {
    category: string;
    title: string;
    body: string;
    imageUrl?: string;
}

export interface NewsletterEmailProps {
    subject: string;
    items: NewsletterEmailItem[];
    unsubscribeUrl?: string;
    // Absolute URL to the real logo - resolved server-side (email clients
    // can't do a client-side onError fallback the way <CommunityLogo> does).
    logoUrl?: string;
}

export default function NewsletterEmail({ subject, items, unsubscribeUrl, logoUrl }: NewsletterEmailProps) {
    return (
        <Html dir="rtl" lang="he">
            <Head />
            <Preview>{subject}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        {logoUrl ? (
                            <Img src={logoUrl} width="48" height="48" alt={COMMUNITY_NAME} style={logoImage} />
                        ) : (
                            <div style={logoCircle}>{LOGO_INITIAL}</div>
                        )}
                        <Heading style={communityName}>{COMMUNITY_NAME}</Heading>
                        <Text style={subjectText}>{subject}</Text>
                    </Section>

                    <Section style={content}>
                        {items.map((item, index) => (
                            <div key={index} style={itemBlock}>
                                <span style={categoryBadge}>{item.category}</span>
                                <Heading as="h3" style={itemTitle}>{item.title}</Heading>
                                <Text style={itemBody}>{item.body}</Text>
                                {item.imageUrl && (
                                    <Img src={item.imageUrl} width="100%" style={itemImage} alt={item.title} />
                                )}
                                {index < items.length - 1 && <Hr style={divider} />}
                            </div>
                        ))}
                    </Section>

                    <Section style={footer}>
                        <Text style={footerText}>{COMMUNITY_NAME} • {COMMUNITY_ADDRESS_LINE}</Text>
                        <Text style={footerText}>נשלח אליך מאחר שאתה רשום בפורטל הקהילה.</Text>
                        {unsubscribeUrl && (
                            <Text style={footerLink}>
                                <a href={unsubscribeUrl} style={link}>הסרה מרשימת התפוצה</a>
                            </Text>
                        )}
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

const main = { backgroundColor: "#f1f5f9", fontFamily: "Arial, Helvetica, sans-serif", padding: "32px 0" };
const container = {
    backgroundColor: "#ffffff",
    maxWidth: "600px",
    margin: "0 auto",
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
};
const header = { backgroundColor: "#92400e", padding: "32px 24px", textAlign: "center" as const };
const logoCircle = {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    color: "#92400e",
    fontWeight: "bold",
    fontSize: "22px",
    lineHeight: "48px",
    textAlign: "center" as const,
    margin: "0 auto 8px",
};
const logoImage = { borderRadius: "16px", margin: "0 auto 8px", display: "block" };
const communityName = { color: "#ffffff", fontSize: "20px", fontWeight: "bold", margin: "0" };
const subjectText = { color: "#fde68a", fontSize: "13px", marginTop: "4px" };
const content = { padding: "24px" };
const itemBlock = { marginBottom: "20px" };
const categoryBadge = {
    display: "inline-block",
    backgroundColor: "#fef3c7",
    color: "#92400e",
    fontSize: "11px",
    fontWeight: 600,
    borderRadius: "999px",
    padding: "2px 10px",
    marginBottom: "8px",
};
const itemTitle = { fontSize: "16px", fontWeight: "bold", color: "#0f172a", margin: "4px 0" };
const itemBody = { fontSize: "13px", color: "#475569", lineHeight: "20px" };
const itemImage = { borderRadius: "12px", marginTop: "8px" };
const divider = { borderColor: "#f1f5f9", margin: "20px 0" };
const footer = {
    backgroundColor: "#f8fafc",
    padding: "24px",
    textAlign: "center" as const,
    borderTop: "1px solid #f1f5f9",
};
const footerText = { fontSize: "11px", color: "#94a3b8", margin: "2px 0" };
const footerLink = { fontSize: "10px", marginTop: "8px" };
const link = { color: "#94a3b8", textDecoration: "underline" };
