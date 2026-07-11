import { nodeConfigProps } from "./nodeTypes";

export function triggerNodeConfig(props: nodeConfigProps) {
  const { id, label, icon, position } = props;

  return {
    id,
    type: "triggerNode",
    referenceTo: [],
    position,
    data: {
      label,
      icon: icon || "/icons/trigger.png",
      triggerType: "event",
      event: {
        service: null,
        config: {},
      },
      schedule: {
        frequency: "",
        cronExpression: "",
        timezone: "UTC",
      },
    },
    constraints: {
      nodeHandles: [
        {
          name: "right",
          type: "source",
          LinkTo: [
            {
              nodeName: "agent",
              handlePosition: "left",
            },
          ],
        },
      ],
    },
  } as any;
}
