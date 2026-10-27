import { it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { ReactApp } from "./ReactApp";
import { store } from "./ReduxStore";
it("renders the connected care workspace and loads patients", async () => {
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/patients"]}>
        <ReactApp />
      </MemoryRouter>
    </Provider>,
  );
  expect(screen.getByText("Your patients")).toBeInTheDocument();
  expect(await screen.findByText("Maya Bennett")).toBeInTheDocument();
});
