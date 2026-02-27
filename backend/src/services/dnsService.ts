import dns from 'dns';

/**
 * Service to verify DNS records for custom domains.
 */
export const dnsService = {
    /**
     * Verifies if a domain points to our target host.
     * For MVP, we check for a CNAME record pointing to our main domain (ai-chat-lend.ru)
     * Or an A record pointing to our server IP (89.23.102.93).
     */
    async verifyDomain(domain: string): Promise<{ success: boolean; error?: string }> {
        try {
            const targetHost = 'ai-chat-lend.ru';
            const targetIP = '89.23.102.93';

            // 1. Check CNAME
            try {
                const cnames = await dns.promises.resolveCname(domain);
                if (cnames.some(c => c.toLowerCase() === targetHost)) {
                    return { success: true };
                }
            } catch (e) {
                // Ignore CNAME errors and try A record
            }

            // 2. Check A record
            try {
                const addresses = await dns.promises.resolve4(domain);
                if (addresses.includes(targetIP)) {
                    return { success: true };
                }
            } catch (e) {
                return { success: false, error: 'Neither CNAME nor A record found or pointing correctly.' };
            }

            return { success: false, error: 'Domain records are not pointing to our server.' };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
};
