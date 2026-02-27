import { QdrantClient } from '@qdrant/js-client-rest';

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';

export const qdrantClient = new QdrantClient({ url: QDRANT_URL });

export const COLLECTION_NAME = 'knowledge_base';
export const VECTOR_SIZE = 1536; // text-embedding-3-small standard size
export const DISTANCE_METRIC = 'Cosine';

export async function initQdrant() {
    try {
        const result = await qdrantClient.getCollections();
        const exists = result.collections.some((c) => c.name === COLLECTION_NAME);

        if (!exists) {
            console.log(`[Qdrant] Collection '${COLLECTION_NAME}' not found. Creating...`);
            await qdrantClient.createCollection(COLLECTION_NAME, {
                vectors: {
                    size: VECTOR_SIZE,
                    distance: DISTANCE_METRIC,
                },
            });
            console.log(`[Qdrant] Collection '${COLLECTION_NAME}' created.`);

            // Create payload index for tenant_id for faster filtering
            await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
                field_name: 'tenantId',
                field_schema: 'uuid',
            });
            console.log(`[Qdrant] Index on 'tenantId' created.`);
        } else {
            console.log(`[Qdrant] Collection '${COLLECTION_NAME}' already exists.`);
        }
    } catch (e) {
        console.error('[Qdrant] Initialization error:', e);
        // Do not crash the app, just log since Qdrant might be temporarily down or not configured
    }
}
