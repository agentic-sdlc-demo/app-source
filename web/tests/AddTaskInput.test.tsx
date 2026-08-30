import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AddTaskInput } from "../src/components/AddTaskInput";

describe("AddTaskInput", () => {
  it("calls onAdd with the trimmed title on submit and clears the input", async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<AddTaskInput onAdd={onAdd} />);
    const input = screen.getByLabelText("New task title") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "  Buy milk  " } });
    await act(async () => {
      fireEvent.click(screen.getByText("Add task"));
    });
    expect(onAdd).toHaveBeenCalledWith("Buy milk");
    expect(input.value).toBe("");
  });

  it("does not submit an empty or whitespace-only title", () => {
    const onAdd = vi.fn();
    render(<AddTaskInput onAdd={onAdd} />);
    const input = screen.getByLabelText("New task title") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(screen.getByText("Add task"));
    expect(onAdd).not.toHaveBeenCalled();
  });
});
