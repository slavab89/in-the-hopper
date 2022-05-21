export interface HopperEntry {
  status: number;
  ip: string;
  method: string | undefined;
  url: string;
  contentLength: number;
  contentType: string;
  host: string;
  headers: object;
  requestTime?: number;
  responseTime?: number;
  [key: string]: any;
}

export declare function Resolver(fieldInterpreters: object, ...args: any): Partial<HopperEntry>;
// declare function resolveJSON(fieldInterpreters: object, ...args: any): Partial<HopperEntry>;

export declare function Handler(entry: Partial<HopperEntry>): void;

export interface TimestampOptions {
  requestTime?: boolean;
  responseTime?: boolean;
}

export interface HopperOptions {
  fieldInterpreters?: object;
  timestamps?: boolean | Readonly<TimestampOptions>;
  immediate?: boolean;
  resolver?: typeof Resolver;
  handler: typeof Handler;
  ignore?: (...args: any) => boolean;
}
