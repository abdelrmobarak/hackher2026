interface PngChunk {
  type: string;
  data: Buffer;
  startOffset: number;
  endOffset: number;
}

const pngSignature = Buffer.from([
  137, 80, 78, 71, 13, 10, 26, 10
]);

const createCrcTable = () => {
  const table: number[] = [];

  for (let tableIndex = 0; tableIndex < 256; tableIndex += 1) {
    let currentValue = tableIndex;

    for (let innerIndex = 0; innerIndex < 8; innerIndex += 1) {
      currentValue =
        (currentValue & 1) === 1
          ? 0xedb88320 ^ (currentValue >>> 1)
          : currentValue >>> 1;
    }

    table.push(currentValue >>> 0);
  }

  return table;
};

const crcTable = createCrcTable();

const computeCrc32 = (buffer: Buffer) => {
  let currentValue = 0xffffffff;

  for (let byteIndex = 0; byteIndex < buffer.length; byteIndex += 1) {
    const tableOffset = (currentValue ^ buffer[byteIndex]) & 255;
    currentValue = crcTable[tableOffset] ^ (currentValue >>> 8);
  }

  return (currentValue ^ 0xffffffff) >>> 0;
};

const readChunks = (imageBuffer: Buffer) => {
  if (!imageBuffer.subarray(0, pngSignature.length).equals(pngSignature)) {
    throw new Error("PNG metadata operations require a PNG image.");
  }

  const chunks: PngChunk[] = [];
  let currentOffset = pngSignature.length;

  while (currentOffset + 12 <= imageBuffer.length) {
    const dataLength = imageBuffer.readUInt32BE(currentOffset);
    const typeOffset = currentOffset + 4;
    const dataOffset = typeOffset + 4;
    const crcOffset = dataOffset + dataLength;
    const endOffset = crcOffset + 4;

    if (endOffset > imageBuffer.length) {
      break;
    }

    chunks.push({
      type: imageBuffer.toString("ascii", typeOffset, dataOffset),
      data: imageBuffer.subarray(dataOffset, crcOffset),
      startOffset: currentOffset,
      endOffset
    });

    currentOffset = endOffset;
  }

  return chunks;
};

const createTextChunk = (keyword: string, value: string) => {
  const typeBuffer = Buffer.from("tEXt", "ascii");
  const dataBuffer = Buffer.concat([
    Buffer.from(keyword, "latin1"),
    Buffer.from([0]),
    Buffer.from(value, "latin1")
  ]);
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(dataBuffer.length, 0);

  const crcBuffer = Buffer.alloc(4);
  const crcValue = computeCrc32(Buffer.concat([typeBuffer, dataBuffer]));
  crcBuffer.writeUInt32BE(crcValue, 0);

  return Buffer.concat([lengthBuffer, typeBuffer, dataBuffer, crcBuffer]);
};

export const insertTextValue = (
  imageBuffer: Buffer,
  keyword: string,
  value: string
) => {
  const chunks = readChunks(imageBuffer);
  const imageEndChunk = chunks.find((innerChunk) => innerChunk.type === "IEND");

  if (!imageEndChunk) {
    throw new Error("The PNG is missing an IEND chunk.");
  }

  const textChunk = createTextChunk(keyword, value);

  return Buffer.concat([
    imageBuffer.subarray(0, imageEndChunk.startOffset),
    textChunk,
    imageBuffer.subarray(imageEndChunk.startOffset)
  ]);
};

export const extractTextValue = (imageBuffer: Buffer, keyword: string) => {
  const chunks = readChunks(imageBuffer);

  for (const innerChunk of chunks) {
    if (innerChunk.type !== "tEXt") {
      continue;
    }

    const separatorOffset = innerChunk.data.indexOf(0);

    if (separatorOffset <= 0) {
      continue;
    }

    const chunkKeyword = innerChunk.data.toString("latin1", 0, separatorOffset);

    if (chunkKeyword !== keyword) {
      continue;
    }

    return innerChunk.data.toString("latin1", separatorOffset + 1);
  }

  return "";
};

