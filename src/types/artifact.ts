export interface ArtifactVersion {
  id: string;
  versionNumber: number;
  contentText?: string;
  metadataJson?: Record<string, any>;
  createdAt?: string;
  createdBy?: string;
}

export interface ArtifactDelivery {
  id: string;
  workspaceId?: string;
  deliveryType: string;
  targetPath?: string;
  targetUri?: string;
  deliveryStatus?: string;
  message?: string;
  deliveredAt?: string;
  metadataJson?: Record<string, any>;
  createdAt?: string;
}

export interface Artifact {
  id: string;
  specId?: string;
  workflowInstanceId?: string;
  workspaceId?: string;
  name: string;
  title?: string;
  artifactType: string;
  format?: string;
  mimeType?: string;
  latestVersion?: number;
  sourceNodeId?: string;
  contentText?: string;
  metadataJson?: Record<string, any>;
  versions?: ArtifactVersion[];
  deliveries?: ArtifactDelivery[];
  createdAt?: string;
  updatedAt?: string;
}
