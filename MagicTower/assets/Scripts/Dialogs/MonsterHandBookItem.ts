import { Component, instantiate, Label, Prefab, v3, _decorator } from "cc";
import { GameApp } from "../../GameFramework/Scripts/Application/GameApp";
import { CalculateSystem } from "../Logics/Game/System/CalculateSystem";
import { MonsterIcon } from "../Logics/Game/UI/MonsterIcon";
import { HeroAttr } from "../Model/HeroModel/HeroAttr";
import { HeroModel } from "../Model/HeroModel/HeroModel";
import { Monster } from "../Model/MapModel/Data/Elements/Monster";

const { ccclass, property } = _decorator;

@ccclass("MonsterHandBookItem")
export class MonsterHandBookItem extends Component {
    @property(Label)
    private labels: Label[] = [];
    @property(Label)
    private monsterName: Label = null!;
    @property(Label)
    private damageLabel: Label = null!;
    @property(Prefab)
    private monsterIconPrefab: Prefab = null!;

    private monsterNode: any = null;

    init(monster: Monster) {
        let monsterInfo = monster.monsterInfo;
        if (!this.monsterNode) {
            this.monsterNode = instantiate(this.monsterIconPrefab);
            this.monsterNode.position = v3(-120, -20);
            this.monsterNode.parent = this.node;
        }
        this.monsterNode.getComponent(MonsterIcon)?.init(parseInt(monsterInfo.id));
        this.labels[0].string = monsterInfo.hp.toString();
        this.labels[1].string = monsterInfo.attack.toString();
        this.labels[2].string = monsterInfo.defence.toString();
        this.labels[3].string = monsterInfo.gold.toString();
        this.monsterName.string = monsterInfo.name;
        let heroModel = GameApp.getModel(HeroModel);
        let damage = CalculateSystem.totalHeroDamage(heroModel, monster.monsterInfo);
        if (damage == 0) {
            this.damageLabel.string = "无危险";
        } else if (damage >= heroModel.getAttr(HeroAttr.HP)) {
            this.damageLabel.string = "不可攻击";
        } else {
            this.damageLabel.string = `损失${damage}血量`;
        }
    }
}
