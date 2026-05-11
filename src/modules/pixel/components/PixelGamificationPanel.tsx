import React from "react";
import { Trophy, Star, TrendingUp, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePixelGamification } from "../data/usePixelGamification";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface PixelGamificationPanelProps {
  userId: string;
}

export function PixelGamificationPanel({ userId }: PixelGamificationPanelProps) {
  const { data, loading } = usePixelGamification(userId);

  if (loading || !data) {
    return (
      <Card className="bg-pixel-dark/90 border-pixel-purple/30 text-white animate-pulse">
        <CardContent className="p-4">Carregando progresso...</CardContent>
      </Card>
    );
  }

  const progressPercent = (data.xp / data.xp_to_next_level) * 100;

  return (
    <div className="space-y-4 w-full max-w-md">
      {/* Level & XP Card */}
      <Card className="bg-pixel-dark/90 border-pixel-purple/50 text-white shadow-lg shadow-pixel-purple/20">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-pixel-purple" />
            Nível e Experiência
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          <div className="flex justify-between items-end">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-pixel-purple">Lv. {data.level}</span>
              <span className="text-xs text-white/50">{data.points} Pontos OCS</span>
            </div>
            <div className="text-xs text-white/70">
              {data.xp} / {data.xp_to_next_level} XP
            </div>
          </div>
          <Progress value={progressPercent} className="h-2 bg-white/10" indicatorClassName="bg-pixel-purple shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
        </CardContent>
      </Card>

      {/* Achievements Card */}
      <Card className="bg-pixel-dark/90 border-pixel-purple/50 text-white shadow-lg shadow-pixel-purple/20">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Conquistas ({data.unlocked_achievements.length}/{data.available_achievements.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-3">
              {data.available_achievements.map((achievement) => {
                const isUnlocked = data.unlocked_achievements.some(
                  (u) => u.achievement_id === achievement.id
                );

                return (
                  <div 
                    key={achievement.id}
                    className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${
                      isUnlocked 
                        ? "bg-pixel-purple/10 border-pixel-purple/30" 
                        : "bg-black/20 border-white/5 grayscale opacity-60"
                    }`}
                  >
                    <div className={`p-2 rounded-md ${isUnlocked ? "bg-pixel-purple/20" : "bg-white/5"}`}>
                      <Award className={`w-5 h-5 ${isUnlocked ? "text-pixel-purple" : "text-white/30"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-semibold truncate">{achievement.name}</p>
                        {isUnlocked && (
                          <Badge variant="outline" className="text-[10px] h-4 border-pixel-purple/50 text-pixel-purple bg-pixel-purple/5 px-1">
                            DESBLOQUEADO
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-white/50 line-clamp-1">{achievement.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
