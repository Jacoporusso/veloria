import manifestData from '../../../content/manifest.json' with { type: 'json' };

export interface ContentManifest {
  readonly manifestVersion: 1;
  readonly contentVersion: string;
  readonly status: 'prototype';
}

export const contentManifest = manifestData as ContentManifest;

if (contentManifest.manifestVersion !== 1 || !/^veloria-content-[a-z0-9.-]+$/.test(contentManifest.contentVersion)) {
  throw new Error('The Veloria content manifest has an unsupported version or malformed contentVersion.');
}
