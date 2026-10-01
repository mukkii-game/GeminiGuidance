import { BreakoutBlock, GeminiOrb } from '../types';

export class BreakoutManager {
  public blocks: BreakoutBlock[] = [];
  private blockCounter = 0;
  private contacts = new Map<string, string>();

  public setupStage2Wall(canvasWidth: number): void {
    this.clear();
    const center = canvasWidth / 2;
    // Side entry lanes lead to a 64px pocket above the armored bank.
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        this.blocks.push({id: `block_${++this.blockCounter}`, x: center - 84 + col * 56,
          y: 150 + row * 38, width: 50, height: 32, hp: 12, maxHp: 12,
          color: row ? '#f97316' : '#ef4444', points: row ? 180 : 240, active: true});
      }
    }
    for (const [x,y,width,height] of [[center,62,320,12],[20,104,12,96],[canvasWidth-20,104,12,96]]) {
      this.blocks.push({id:`rail_${++this.blockCounter}`,x,y,width,height,hp:1,maxHp:1,
        color:'#67e8f9',points:0,active:true,reflector:true});
    }
  }

  public clear(): void { this.blocks = []; this.contacts.clear(); }
  public getActiveCount(): number { return this.blocks.filter(b => b.active && !b.reflector).length; }

  public checkGeminiCollision(orb: GeminiOrb, radius = orb.radius, damage = orb.damage) {
    const miss = {hit:false,block:null as BreakoutBlock|null,broken:false,points:0,hitX:0,hitY:0,normalX:0,normalY:0,rear:false};
    if (!this.getActiveCount()) { for (const b of this.blocks) b.active=false; return miss; }
    for (const b of this.blocks) {
      if (!b.active) continue;
      const hw=b.width/2, hh=b.height/2;
      let x=Math.max(b.x-hw,Math.min(orb.x,b.x+hw));
      let y=Math.max(b.y-hh,Math.min(orb.y,b.y+hh));
      let nx=orb.x-x, ny=orb.y-y;
      const distance=Math.hypot(nx,ny);
      if(distance>=radius) continue;
      if(distance>0.001){nx/=distance;ny/=distance;}
      else if(hw-Math.abs(orb.x-b.x)<hh-Math.abs(orb.y-b.y)){
        nx=orb.x<b.x?-1:1;ny=0;x=b.x+nx*hw;
      }else{nx=0;ny=orb.y<b.y?-1:1;y=b.y+ny*hh;}
      // Separating contacts never deal damage twice or bounce again.
      if(orb.vx*nx+orb.vy*ny>=0 || this.contacts.get(orb.id)===b.id) continue;
      this.contacts.set(orb.id,b.id);
      const rear=ny < -0.5 && !b.reflector;
      if(!b.reflector) b.hp-=rear ? Math.max(3,damage*3) : Math.max(1,Math.ceil(damage*0.35));
      const broken=!b.reflector && b.hp<=0;
      if(broken)b.active=false;
      return {hit:true,block:b,broken,points:b.points,hitX:x,hitY:y,normalX:nx,normalY:ny,rear};
    }
    this.contacts.delete(orb.id);
    return miss;
  }
}
