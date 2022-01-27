import { GameFrameworkError } from "../../Base/GameFrameworkError";
import { GameFrameworkLinkedList, LinkedListNode } from "../../Base/GameFrameworkLinkedList";
import { ReferencePool } from "../../Base/ReferencePool/ReferencePool";
import { ScheduleInfo } from "./ScheduleInfo";

export class ScheduleBase {
    private _scheduleHandles: GameFrameworkLinkedList<ScheduleInfo> = null!;
    private static readonly DEFAULT_FRAME_SECONDS: number = 0.016;

    constructor() {
        this._scheduleHandles = new GameFrameworkLinkedList<ScheduleInfo>();
    }

    /**
     * 开启定时器
     * @param handle 回调函数
     * @param interval 定时器间隔
     * @param count 定时个数,默认为无限大
     * @param priority 定时器优先级
     */
    schedule(handle: Function, interval: number, count: number = Number.MAX_SAFE_INTEGER, priority: number = 0): void {
        if (interval < 0) {
            throw new GameFrameworkError("interval is invalid");
        } else if (interval == 0) {
            interval = ScheduleBase.DEFAULT_FRAME_SECONDS;
        }

        if (count < 0) {
            throw new GameFrameworkError("count is invalid");
        }

        let scheduleInfo = ScheduleInfo.create(handle, this, interval, count, priority);
        let node: LinkedListNode<ScheduleInfo> | null = null;
        if (this._scheduleHandles.size > 0) {
            for (let current = this._scheduleHandles.first; current != null; current = current.next) {
                if (scheduleInfo.priority >= current.value.priority) {
                    node = current;
                    break;
                }
            }
        }

        if (node) {
            this._scheduleHandles.addBefore(node, scheduleInfo);
        } else {
            this._scheduleHandles.addLast(scheduleInfo);
        }
    }

    /**
     * 开启一次定时器
     * @param handle 回调函数
     * @param interval 定时器间隔
     * @param priority 定时器优先级
     */
    scheduleOnce(handle: Function, interval: number, priority: number = 0): void {
        this.schedule(handle, interval, 1, priority);
    }

    /**
     * 轮询定时器
     * @param elapseSeconds 逻辑流逝时间
     */
    update(elapseSeconds: number): void {
        if (this._scheduleHandles.size != 0) {
            let current: LinkedListNode<ScheduleInfo> | null = this._scheduleHandles.first;
            let next: LinkedListNode<ScheduleInfo> | null = null;
            while (current) {
                current.value.update(elapseSeconds);
                if (current.value.isStoped()) {
                    next = current.next;
                    this._scheduleHandles.remove(current);
                    current = next;
                } else {
                    current = current.next;
                }
            }
        }
    }

    clear() {
        this._scheduleHandles.forEach((scheduleInfo: ScheduleInfo) => {
            ReferencePool.release(scheduleInfo);
        });
        this._scheduleHandles.clear();
    }
}
