import { Body, Container, Head, Heading, Html, Img, Preview, Section, Text } from "@react-email/components";
import { COMMUNITY_NAME, LOGO_INITIAL } from "@/lib/branding";

export interface JoinRequestReplyEmailProps {
    subject: string;
    recipientFirstName: string;
    body: string;
    // Absolute URL to the real logo - resolved server-side (email clients
    // can't do a client-side onError fallback the way <CommunityLogo> does).
    logoUrl?: string;
}

export default function JoinRequestReplyEmail({
    subject,
    recipientFirstName,
    body,
    logoUrl,
}: JoinRequestReplyEmailProps) {
    return (
        <Html dir="rtl" lang="he">
            <Head />
            <Preview>{subject}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        {logoUrl ? (
                            <Img src={logoUrl} width="44" height="44" alt={COMMUNITY_NAME} style={logoImage} />
                        ) : (
                            <div style={logoCircle}>{LOGO_INITIAL}</div>
                        )}
                        <Heading style={communityName}>{COMMUNITY_NAME}</Heading>
                    </Section>

                    <Section style={content}>
                        <Text style={greeting}>שלום {recipientFirstName},</Text>
                        {body.split("\n").map((line, index) => (
                            <Text key={index} style={bodyLine}>{line || " "}</Text>
                        ))}
                    </Section>

                    <Section style={footer}>
                        <Text style={footerText}>נשלח אליך על ידי גבאי הקהילה בהמשך לבקשת ההצטרפות שהגשת.</Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

const main = { backgroundColor: "#faf7f0", fontFamily: "Arial, Helvetica, sans-serif", padding: "32px 0" };
const container = {
    backgroundColor: "#ffffff",
    maxWidth: "560px",
    margin: "0 auto",
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid #e5dfd0",
};
const header = { backgroundColor: "#0e4a47", padding: "28px 24px", textAlign: "center" as const };
const logoCircle = {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    backgroundColor: "#ffffff",
    color: "#0e4a47",
    fontWeight: "bold",
    fontSize: "20px",
    lineHeight: "44px",
    textAlign: "center" as const,
    margin: "0 auto 8px",
};
const logoImage = { borderRadius: "14px", margin: "0 auto 8px", display: "block" };
const communityName = { color: "#ffffff", fontSize: "18px", fontWeight: "bold", margin: "0" };
const content = { padding: "28px 24px" };
const greeting = { fontSize: "15px", fontWeight: "bold", color: "#1f2a28", margin: "0 0 12px" };
const bodyLine = { fontSize: "14px", color: "#1f2a28", lineHeight: "22px", margin: "0 0 4px" };
const footer = {
    backgroundColor: "#faf7f0",
    padding: "18px 24px",
    textAlign: "center" as const,
    borderTop: "1px solid #e5dfd0",
};
const footerText = { fontSize: "11px", color: "#5b6b68", margin: "0" };
