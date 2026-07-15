export interface RegionConfig {
  readonly name: string;
  readonly webBaseUrl: string;
  readonly apiBaseUrl: string;
  readonly browserLocale: string;
  readonly browserTimezone: string;
  readonly credentials: {
    readonly username: string;
    readonly password: string;
  };
  readonly metadata?: Record<string, string>;
}
