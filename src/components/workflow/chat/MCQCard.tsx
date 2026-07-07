import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

type MCQ = {
  section: string;
  question: string;
  options: string[];
};

export default function MCQCard({
  mcq,
  onSelect,
  selectedAnswer,
  index = 0,
  total = 1,
}: {
  mcq: MCQ;
  onSelect: (answer: string) => void;
  selectedAnswer?: string;
  index?: number;
  total?: number;
}) {
  const [isCustom, setIsCustom] = useState(false);

  const handleOptionClick = (option: string) => {
    if (option === "Type your own answer") {
      setIsCustom(true);
      onSelect("Type your own answer");
    } else {
      setIsCustom(false);
      onSelect(option);
    }
  };

  return (
    <Card className="border border-slate-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {mcq.section}
          </p>
          <p className="text-xs text-slate-400">
            Question {index + 1} of {total}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm font-medium text-slate-900">{mcq.question}</p>
        <div className="flex flex-wrap gap-2">
          {mcq.options.map((option: string, i: number) => {
            if (option === "Type your own answer" && isCustom) {
              return (
                <Input
                  key={i}
                  placeholder="Type your own answer..."
                  value={selectedAnswer === "Type your own answer" ? "" : (selectedAnswer ?? "")}
                  onChange={(e) => onSelect(e.target.value)}
                  className="w-full"
                  autoFocus
                />
              );
            }
            return (
              <Button
                key={i}
                variant={option === selectedAnswer ? "default" : "outline"}
                size="sm"
                className="text-sm"
                onClick={() => handleOptionClick(option)}
              >
                {option}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
