import { MongoMemoryReplSet } from 'mongodb-memory-server';

let replSet;

/** Starts one in-memory replica set for the whole test run (transactions supported). */
export async function setup({ provide }) {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  provide('mongoUri', replSet.getUri('ecommerce-test'));
}

export async function teardown() {
  await replSet?.stop();
}
