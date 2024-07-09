import { Test } from "@nestjs/testing";
import { QueueWorker, QueueWorkerProcess } from "./decorators";
import { QueueWorkerExplorerService } from "./explorer.service";
import { QueueWorkerModule } from "./worker.module";
describe("QueueWorkerExplorerService", () => {
  it("should get empty workers", async () => {
    const app = await Test.createTestingModule({ imports: [QueueWorkerModule.register()] }).compile();
    const explorer = app.get<QueueWorkerExplorerService>(QueueWorkerExplorerService);
    expect(explorer).toBeDefined();
    expect(explorer.explore()).toEqual([]);
  });

  it("should get worker", async () => {
    @QueueWorker("TestWorker")
    class TestWorker {}

    @QueueWorker({ name: "TestWorker2" })
    class TestWorker2 {}

    const app = await Test.createTestingModule({
      imports: [QueueWorkerModule.register()],
      providers: [TestWorker, TestWorker2],
    }).compile();
    const explorer = app.get<QueueWorkerExplorerService>(QueueWorkerExplorerService);
    expect(explorer).toBeDefined();
    expect(explorer.explore()).toEqual([
      {
        className: "TestWorker",
        instance: expect.any(TestWorker),
        name: "TestWorker",
        priority: 0,
        processors: [],
      },
      {
        className: "TestWorker2",
        instance: expect.any(TestWorker2),
        name: "TestWorker2",
        priority: 0,
        processors: [],
      },
    ]);
  });

  it("should get multiple workers", async () => {
    @QueueWorker(["TestWorker1", "TestWorker2"])
    class TestWorker {}

    @QueueWorker({ name: ["TestWorker3", "TestWorker4"] })
    class TestWorker2 {}

    const app = await Test.createTestingModule({
      imports: [QueueWorkerModule.register()],
      providers: [TestWorker, TestWorker2],
    }).compile();
    const explorer = app.get<QueueWorkerExplorerService>(QueueWorkerExplorerService);
    expect(explorer).toBeDefined();
    expect(explorer.explore()).toEqual([
      {
        className: "TestWorker",
        instance: expect.any(TestWorker),
        name: "TestWorker1",
        priority: 0,
        processors: [],
      },
      {
        className: "TestWorker",
        instance: expect.any(TestWorker),
        name: "TestWorker2",
        priority: 0,
        processors: [],
      },
      {
        className: "TestWorker2",
        instance: expect.any(TestWorker2),
        name: "TestWorker3",
        priority: 0,
        processors: [],
      },
      {
        className: "TestWorker2",
        instance: expect.any(TestWorker2),
        name: "TestWorker4",
        priority: 0,
        processors: [],
      },
    ]);
  });

  it("should get worker and processor", async () => {
    @QueueWorker("TestWorker")
    class TestWorker {
      @QueueWorkerProcess()
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      public async process(): Promise<void> {}

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      public async noProcess(): Promise<void> {}
    }

    const app = await Test.createTestingModule({
      imports: [QueueWorkerModule.register()],
      providers: [TestWorker],
    }).compile();
    const explorer = app.get<QueueWorkerExplorerService>(QueueWorkerExplorerService);
    expect(explorer).toBeDefined();
    expect(explorer.explore()).toEqual([
      {
        className: "TestWorker",
        instance: expect.any(TestWorker),
        name: "TestWorker",
        priority: 0,
        processors: [expect.anything()],
      },
    ]);
  });

  it("should not get disabled worker and processor", async () => {
    @QueueWorker({ enabled: false, name: "TestWorker" })
    class TestWorker {
      @QueueWorkerProcess()
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      public async process(): Promise<void> {}
    }

    @QueueWorker("TestWorker2")
    class TestWorker2 {
      @QueueWorkerProcess()
      public async process(): Promise<void> {}

      @QueueWorkerProcess({ enabled: false })
      public async process2(): Promise<void> {}
    }

    const app = await Test.createTestingModule({
      imports: [QueueWorkerModule.register()],
      providers: [TestWorker, TestWorker2],
    }).compile();
    const explorer = app.get<QueueWorkerExplorerService>(QueueWorkerExplorerService);
    expect(explorer).toBeDefined();
    expect(explorer.explore()).toEqual([
      {
        className: "TestWorker2",
        instance: expect.any(TestWorker2),
        name: "TestWorker2",
        priority: 0,
        processors: [expect.anything()],
      },
    ]);
  });

  it("priority", async () => {
    @QueueWorker({ name: "TestWorker", priority: 1 })
    class TestWorker {
      @QueueWorkerProcess({ priority: 1 })
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      public async process1(): Promise<void> {}

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      @QueueWorkerProcess({ priority: 0 })
      public async process2(): Promise<void> {}
    }

    @QueueWorker({ name: "TestWorker2", priority: 0 })
    class TestWorker2 {
      @QueueWorkerProcess({ priority: 0 })
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      public async process1(): Promise<void> {}

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      @QueueWorkerProcess({ priority: 1 })
      public async process2(): Promise<void> {}
    }

    const app = await Test.createTestingModule({
      imports: [QueueWorkerModule.register()],
      providers: [TestWorker, TestWorker2],
    }).compile();
    const explorer = app.get<QueueWorkerExplorerService>(QueueWorkerExplorerService);
    expect(explorer).toBeDefined();
    expect(explorer.explore()).toEqual([
      {
        className: "TestWorker2",
        instance: expect.any(TestWorker2),
        name: "TestWorker2",
        priority: 0,
        processors: [
          {
            priority: 0,
            processor: expect.any(Function),
            processorName: "TestWorker2.process1",
            workerName: "TestWorker2",
          },
          {
            priority: 1,
            processor: expect.any(Function),
            processorName: "TestWorker2.process2",
            workerName: "TestWorker2",
          },
        ],
      },
      {
        className: "TestWorker",
        instance: expect.any(TestWorker),
        name: "TestWorker",
        priority: 1,
        processors: [
          {
            priority: 0,
            processor: expect.any(Function),
            processorName: "TestWorker.process2",
            workerName: "TestWorker",
          },
          {
            priority: 1,
            processor: expect.any(Function),
            processorName: "TestWorker.process1",
            workerName: "TestWorker",
          },
        ],
      },
    ]);
  });
});
