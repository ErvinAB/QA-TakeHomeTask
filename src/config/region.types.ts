export interface RegionConfig {
  readonly name: string;
  readonly port: number;
  readonly webBaseUrl: string;
  readonly apiBaseUrl: string;
  readonly browserLocale: string;
  readonly browserTimezone: string;
  readonly serverLocale: string;
  readonly currencyCode: string;
  readonly composeProjectName: string;
  readonly dbDatabase: string;
  readonly dbUsername: string;
  readonly defaultTestEmail: string;
  readonly testUserPassword: string;
}
