import argparse
import random
from pathlib import Path

import torch
from torch import nn
from torch.optim import AdamW
from torch.utils.data import DataLoader
from torchvision import datasets
from torchvision.models import EfficientNet_V2_S_Weights
from torchvision.models import efficientnet_v2_s

def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--output-path", required=True)
    parser.add_argument("--resume-from")
    parser.add_argument("--epochs", type=int, default=1)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--learning-rate", type=float, default=1e-3)
    parser.add_argument("--train-per-class", type=int, default=400)
    parser.add_argument("--val-per-class", type=int, default=100)
    return parser.parse_args()


def limit_dataset(
    dataset: datasets.ImageFolder,
    per_class_limit: int
) -> list[int]:
    grouped_indices: dict[int, list[int]] = {}

    for index, label in enumerate(dataset.targets):
        grouped_indices.setdefault(label, []).append(index)

    sampled_indices: list[int] = []

    for label, label_indices in grouped_indices.items():
        random.Random(42 + label).shuffle(label_indices)
        sampled_indices.extend(label_indices[:per_class_limit])

    return sampled_indices


def create_subset_loader(
    directory: Path,
    per_class_limit: int,
    image_transform,
    batch_size: int,
    shuffle: bool
) -> DataLoader:
    dataset = datasets.ImageFolder(directory, transform=image_transform)
    subset_indices = limit_dataset(dataset, per_class_limit)
    subset = torch.utils.data.Subset(dataset, subset_indices)

    return DataLoader(
        subset,
        batch_size=batch_size,
        shuffle=shuffle,
        num_workers=0,
    )


def load_checkpoint_if_available(
    model: torch.nn.Module,
    checkpoint_path: Path | None,
    device: torch.device
) -> None:
    if not checkpoint_path or not checkpoint_path.exists():
        return

    checkpoint = torch.load(checkpoint_path, map_location=device)
    state_dict = checkpoint.get("model_state_dict")

    if state_dict:
        model.load_state_dict(state_dict)


def train_epoch(
    model: torch.nn.Module,
    data_loader: DataLoader,
    loss_function: nn.Module,
    optimizer: AdamW,
    device: torch.device
) -> None:
    model.train()

    for pixel_values, labels in data_loader:
        pixel_values = pixel_values.to(device)
        labels = labels.to(device)
        optimizer.zero_grad()
        logits = model(pixel_values)
        loss = loss_function(logits, labels)
        loss.backward()
        optimizer.step()


def evaluate(
    model: torch.nn.Module,
    data_loader: DataLoader,
    device: torch.device
) -> float:
    model.eval()
    correct_predictions = 0
    total_predictions = 0

    with torch.no_grad():
        for pixel_values, labels in data_loader:
            pixel_values = pixel_values.to(device)
            labels = labels.to(device)
            logits = model(pixel_values)
            predicted_labels = torch.argmax(logits, dim=1)
            correct_predictions += int((predicted_labels == labels).sum().item())
            total_predictions += int(labels.size(0))

    if total_predictions == 0:
        return 0.0

    return correct_predictions / total_predictions


def main() -> None:
    arguments = parse_arguments()
    data_directory = Path(arguments.data_dir)
    train_directory = data_directory / "train"
    validation_directory = data_directory / "valid"
    weights = EfficientNet_V2_S_Weights.DEFAULT
    image_transform = weights.transforms()
    train_loader = create_subset_loader(
        train_directory,
        arguments.train_per_class,
        image_transform,
        arguments.batch_size,
        True
    )
    validation_loader = create_subset_loader(
        validation_directory,
        arguments.val_per_class,
        image_transform,
        arguments.batch_size,
        False
    )
    device = torch.device("cpu")
    model = efficientnet_v2_s(weights=weights)
    input_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(input_features, 2)
    resume_path = Path(arguments.resume_from) if arguments.resume_from else None
    load_checkpoint_if_available(model, resume_path, device)

    for parameter in model.features.parameters():
        parameter.requires_grad = False

    model.to(device)
    optimizer = AdamW(model.classifier.parameters(), lr=arguments.learning_rate)
    loss_function = nn.CrossEntropyLoss()

    for _ in range(arguments.epochs):
        train_epoch(model, train_loader, loss_function, optimizer, device)

    validation_accuracy = evaluate(model, validation_loader, device)
    output_path = Path(arguments.output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(
        {
            "model_state_dict": model.state_dict(),
            "validation_accuracy": validation_accuracy,
            "label_names": ["fake", "real"],
        },
        output_path,
    )


if __name__ == "__main__":
    main()
