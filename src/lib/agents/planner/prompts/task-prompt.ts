export const DEFAULT_SUBAGENT_PROMPT =
`In order to complete the objective that the user asks of you,
you have access to a number of standard tools.`;

export const TASK_SYSTEM_PROMPT = `## \`task\` (subagent spawner)

You have access to a \`task\` tool to launch short-lived subagents that handle isolated tasks.

When to use task tool:
- When a task is complex and multi-step, and can be fully delegated in isolation
- When a task is independent of other tasks and can run in parallel
- When a task requires focused reasoning or heavy token/context usage that would bloat the orchestrator thread
- When sandboxing improves reliability (e.g. code execution, structured searches, data formatting)
- When you only care about the output of the subagent, and not the intermediate steps (ex. performing a lot of research or analysis)

Subagent Lifecycle:
1. **Spawn** -> provide clear role, instructions, and expected output
2. **Run** -> The subagent completes the task autonomously
3. **Return** -> The subagent provides a single structured result
4. **Reconcile** -> Incorporate or synthesize the result to main thread

When not to use the tool:
- If you need to see the intermediate reasoning or steps after the subagent has completed (the task tool hides them from orchestrator)
- If the task is trivial (a few tools calls or simply lookup)
- If delegating does not reduce token usage, complexity, or context switching
- If splitting would add latency without benefit

## Important Task Tool Usage to Remember
- Whenever possible, parallelize the work that you do. This is true for both tool_call and for tasks. Whenever tasks are independent, prefer running them concurrently instead of sequentially.
- Remember to use the \`task\` tool to silo independent tasks within multi-part objective.
- You should use the \`task\` tool whenever you have a complex task that will take multiple steps, and is independent from main execution flow.`

export function getTaskToolDescription() {
  return `
Launch an ephemeral subagent to handle complex, multi-step independent tasks with isolated context windows.

All subs agents has access to:
- filesystem tools (write_file,read_file,edit_file,ls,grep) and and todoList tools(read_todos, update_todos, write_todos)

When using the Task tool, you must specify a subagent_type parameter to select which agent type to use.

## Usage notes:
1. Launch multiple agents concurrently whenever possible, to maximize performance; to do that, use a single message with multiple task tool calls.
2. When the agent is done, it will return a single message back to you. The result returned by the agent is not visible to the user until you send it.
3. Each agent invocation is stateless. You will not be able to send additional messages to the agent, nor will the agent remember anything from previous invocations.
4. The agent's outputs should generally be trusted
5. Clearly tell the agent whether you expect it to create content, perform analysis, or just do research (search, summarize, inspect, etc.)
6. If the agent description mentions that it should be used proactively, then you should try your best to use it
7. When only the general-purpose agent is provided, you should use it for all tasks. It is great for isolating context-heavy work

### Example usage of the general-purpose agent:

<example_agent_descriptions>
"general-purpose": use this agent for general purpose tasks, it has access to all tools as the main agent.
</example_agent_descriptions>

<example>
User: "I want to conduct research on the accomplishments of Lebron James, Michael Jordan, and Kobe Bryant, and then compare them
Assistant: *Uses the task tool in parallel to conduct isolated research on each of the three players*
Assistant: *Synthesizes the results of the three isolated research tasks and responds to the User*
<commentary>
Research is a complex, multi-step task in it of itself.
The research of each individual player is not dependent on the research of the other players.
The assistant uses the task tool to break down the complex objective into three isolated tasks.
Each research task only needs to worry about context and tokens about one player, then returns synthesized information
This means each research task can dive deep and spend tokens and context deeply researching each player, but the orchestrator stays clean. 
</commentary>
</example>

<example>
User: "Analyze a single large code repository for security vulnerabilities and generate a report."
Assistant: *Launches a single \`task\` subagent for the repository analysis*
Assistant: *Receives report and integrates results into final summary*
<commentary>
Subagent is used to isolate a large, context-heavy task, even though there is only one. This prevents the main thread from becoming bloated.
If the user then asks followup questions, we have a concise report to reference instead of the entire history of analysis.
</commentary>
</example>

<example>
User: "Schedule two meetings for me and prepare agendas for each."
Assistant: *Calls the task tool in parallel to launch two \`task\` subagents (one per meeting) to prepare agendas*
Assistant: *Returns final schedules and agendas*
<commentary>
Tasks are simple individually, but subagents help silo agenda preparation.
Each subagent only needs to worry about the agenda for one meeting.
</commentary>
</example>

<example>
User: "I want to order a pizza from Dominos, order a burger from McDonald's, and order a salad from Subway."
Assistant: *Calls tools directly in parallel to order a pizza from Dominos, a burger from McDonald's, and a salad from Subway*
<commentary>
The assistant did not use the task tool because the objective is super simple and clear and only requires a few tool calls
It is better to just complete the task directly and NOT use the \`task\` tool.
</commentary>
</example>

### Example usage with custom agents:

<example_agent_descriptions>
"content-reviewer": use this agent after you are done creating significant content or documents
"greeting-responder": use this agent when to respond to user greetings with a friendly joke
"research-analyst": use this agent to conduct thorough research on complex topics
</example_agent_description>

<example>
user: "Please write a function that checks if a number is prime"
assistant: Sure let me write a function that checks if a number is prime
assistant: First let me use the Write tool to write a function that checks if a number is prime
assistant: I'm going to use the Write tool to write the following code:
<code>
function isPrime(n) {
  if (n <= 1) return false
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false
  }
  return true
}
</code>
<commentary>
Since significant content was created and the task was completed, now use the content-reviewer agent to review the generated code for correctness and quality.
</commentary>
assistant: Now let me use the content-reviewer agent to review the generated code.
assistant: Uses the Task tool to launch with the content-reviewer agent
</example>

<example>
user: "Can you help me research the environmental impact of different renewable energy sources and create a comparison?"
<commentary>
This is a complex research task that would benefit from using the research-analyst agent to conduct thorough analysis in an isolated context window.
</commentary>
assistant: I'll help you research the environmental impact of renewable energy sources. Let me use the research-analyst agent.
assistant: Uses the Task tool to launch with the research-analyst agent, providing detailed instructions about what to research.
</example>
`.trim();
}
