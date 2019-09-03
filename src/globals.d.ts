declare interface HopperEntry {
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

interface TimestampOptions {
  requestTime?: boolean;
  responseTime?: boolean;
}

interface HopperOptions {
  fieldInterpreters: object;
  timestamps?: boolean | Readonly<TimestampOptions>;
  immediate?: boolean;
  resolver: typeof Resolver;
  handler: typeof Handler;
  ignore?: (...args: any) => boolean;
}

declare function Resolver(fieldInterpreters: object, ...args: any): Partial<HopperEntry>;
// declare function resolveJSON(fieldInterpreters: object, ...args: any): Partial<HopperEntry>;

declare function Handler(entry: Partial<HopperEntry>): void;

interface ModuleOptions {
  handler: typeof Handler;
  type: string;
  defaultFields: boolean;
  immediate: boolean;
  timestamps: boolean | Readonly<TimestampOptions>;
  ignore: (...args: any) => boolean;
  resolver: typeof Resolver;
  middlewareCreator: (opts: HopperOptions) => Function;
}
