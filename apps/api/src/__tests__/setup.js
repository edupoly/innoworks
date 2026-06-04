import { jest } from '@jest/globals';
import IoredisMock from 'ioredis-mock';
import mongoose from 'mongoose';
import EventEmitter from 'events';

// Stub mongoose.connect and connection db methods to prevent real network calls
mongoose.connect = async () => {
  mongoose.connection.readyState = 1; // Mock state: connected
  mongoose.connection.db = {
    admin: async () => ({}),
    listCollections: () => ({
      toArray: async () => [],
    }),
    collection: () => ({
      dropIndex: async () => ({}),
    }),
  };
  return mongoose;
};

// Also mock connection.close so it doesn't try to close a non-existent connection
mongoose.connection.close = async () => {
  mongoose.connection.readyState = 0; // Disconnected
  return Promise.resolve();
};

// Mock ioredis
jest.unstable_mockModule('ioredis', () => {
  return {
    default: IoredisMock,
    Redis: IoredisMock,
  };
});

// Mock bullmq to avoid real Redis streams and Lua scripts in tests
class MockQueue extends EventEmitter {
  constructor() {
    super();
  }
  async add(name, data) {
    return { id: 'mock-job-id', name, data };
  }
  async close() {
    return Promise.resolve();
  }
}

class MockWorker extends EventEmitter {
  constructor() {
    super();
  }
  async close() {
    return Promise.resolve();
  }
}

jest.unstable_mockModule('bullmq', () => {
  return {
    Queue: MockQueue,
    Worker: MockWorker,
  };
});
