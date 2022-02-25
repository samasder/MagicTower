import { JsonAsset } from "cc";
import { GameFrameworkError } from "../Base/GameFrameworkError";
import { IResourceManager } from "../Resource/IResourceManager";
import { SystemUtility } from "./SystemUtility";

/**
 * Json工具类
 */
export class JsonUtility {
    private _resourceManger: IResourceManager = null!;
    private _jsonDirPath: string = "Json";
    private readonly _cacheJsonKeyMap: Map<string, Map<string, Map<number | string, object>>> = null!;
    private _systemUtility: SystemUtility = null!;

    constructor() {
        this._cacheJsonKeyMap = new Map<string, Map<string, Map<number | string, object>>>();
    }

    /**
     * 设置资源管理器
     * @param resourceManger
     */
    setResourceManager(resourceManger: IResourceManager): void {
        this._resourceManger = resourceManger;
    }

    /**
     * 设置系统工具类
     * @param systemUtility
     */
    setSystemUtility(systemUtility: SystemUtility): void {
        this._systemUtility = systemUtility;
    }

    /**
     * 设置json文件夹路径
     * @param path
     */
    setJsonDirPath(path: string) {
        this._jsonDirPath = path;
    }

    /**
     * 从本地文件夹动态获取json
     * @param path json路径
     * @param clone 是否克隆json
     * @returns json对象
     */
    getJson<T extends object>(path: string, clone: boolean = false): T | null {
        let jsonAsset = this._resourceManger.getAsset(`${this._jsonDirPath}/${path}`, JsonAsset);
        if (jsonAsset) {
            let json: any = clone ? this._systemUtility.clone(jsonAsset.json) : jsonAsset.json;
            return json;
        } else {
            throw new GameFrameworkError(`can't find json ${path}`);
        }
    }

    /**
     * 从本地文件夹动态获取json元素
     * @param path json路径
     * @param elementName json元素名字
     * @param clone 是否克隆json元素
     * @returns json元素
     */
    getJsonElement<T extends Object>(path: string, elementName: number | string, clone: boolean = false): T | null {
        let json = this.getJson<any>(path);
        if (json) {
            let member = json[elementName];
            if (member) {
                return clone ? this._systemUtility.clone(member) : member;
            }
            return null;
        } else {
            throw new GameFrameworkError(`can't find json ${path}`);
        }
    }

    /**
     * 根据json元素名字的值索引json元素
     * @param path json路径
     * @param key json元素名字
     * @param value json元素的值
     * @returns json元素
     */
    getJsonKeyCache<T extends object>(path: string, key: string, value: number | string): T | null {
        let json = this.getJson<any>(path);
        if (json) {
            let keyCache = this.internalGetJsonKeyCache(json, path, key);
            return (keyCache.get(value) as T) || null;
        } else {
            throw new GameFrameworkError(`can't find json ${path}`);
        }
    }

    /**
     * 内部获得json的key缓存
     * @param json
     * @param path
     * @param key
     * @returns
     */
    private internalGetJsonKeyCache(json: object, path: string, key: string): Map<number | string, object> {
        let jsonCache = this._cacheJsonKeyMap.get(path);
        if (!jsonCache) {
            jsonCache = new Map<string, Map<number | string, object>>();
        }
        let keyCache = jsonCache.get(key);
        if (!keyCache) {
            keyCache = new Map<number | string, object>();
            for (let id in json) {
                let jsonObject = (json as any)[id];
                let value = jsonObject[key];
                keyCache.set(value, jsonObject);
            }
        }

        return keyCache;
    }
}
