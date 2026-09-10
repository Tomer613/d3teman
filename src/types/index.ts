// Halachic status definition
export type HalachicStatus = "kohen" | "levi" | "yisrael";

// User system roles
export type UserRole = "member" | "content_admin" | "gabay" | "super_admin";

// Yahrzeit record for memorial and Shabbat call-up tracking
export interface Yahrzeit {
    id: string;
    deceasedName: string; // E.g., "Shalom ben Yosef"
    relation: "father" | "mother" | "brother" | "sister" | "spouse" | "child" | "other";
    hebrewDate: {
        day: number; // 1-30
        month: string; // E.g., "Tishrei", "Nisan"
        year?: number;
    };
    diedAfterSunset: boolean; // Crucial for accurate Hebrew calendar matching
    notes?: string;
}

// Child age grouping for community activities
export interface ChildGroup {
    ageGroup: "toddler" | "elementary" | "teen";
    count: number;
}

// Member profile structure
export interface MemberProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: {
        street: string;
        city: string;
        neighborhood?: string;
    };
    halachicStatus: HalachicStatus;
    role: UserRole;
    isApproved: boolean; // Requires admin verification upon registration
    children: ChildGroup[];
    yahrzeits: Yahrzeit[];
    privacy: {
        showPhoneInDirectory: boolean;
        showAddressInDirectory: boolean;
    };
    createdAt: string;
}

// Nedarim Plus transaction payload skeleton
export interface NedarimTransaction {
    transactionId: string;
    clientName: string;
    amount: number;
    currency: "ILS" | "USD";
    targetFund: string; // Specific fund/cause in the synagogue
    date: string;
    memberId?: string; // Matched internal member ID
}