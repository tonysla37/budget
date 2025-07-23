import 'dart:convert';
import 'package:json_annotation/json_annotation.dart';

part 'transaction.g.dart';

@JsonSerializable()
class Transaction {
  final int id;
  final int userId;
  final DateTime date;
  final double amount;
  final String description;
  final String? merchant;
  final bool isExpense;
  final bool isRecurring;
  final int? categoryId;
  final String? externalId;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final Category? category;
  final List<Tag> tags;

  Transaction({
    required this.id,
    required this.userId,
    required this.date,
    required this.amount,
    required this.description,
    this.merchant,
    required this.isExpense,
    required this.isRecurring,
    this.categoryId,
    this.externalId,
    required this.createdAt,
    this.updatedAt,
    this.category,
    this.tags = const [],
  });

  factory Transaction.fromJson(Map<String, dynamic> json) => _$TransactionFromJson(json);
  
  Map<String, dynamic> toJson() => _$TransactionToJson(this);
}

@JsonSerializable()
class Category {
  final int id;
  final String name;
  final String? description;
  final String? color;
  final String? icon;
  final int? userId;
  final DateTime createdAt;

  Category({
    required this.id,
    required this.name,
    this.description,
    this.color,
    this.icon,
    this.userId,
    required this.createdAt,
  });

  factory Category.fromJson(Map<String, dynamic> json) => _$CategoryFromJson(json);
  
  Map<String, dynamic> toJson() => _$CategoryToJson(this);
}

@JsonSerializable()
class Tag {
  final int id;
  final String name;
  final String? description;
  final String? color;
  final int? userId;
  final DateTime createdAt;

  Tag({
    required this.id,
    required this.name,
    this.description,
    this.color,
    this.userId,
    required this.createdAt,
  });

  factory Tag.fromJson(Map<String, dynamic> json) => _$TagFromJson(json);
  
  Map<String, dynamic> toJson() => _$TagToJson(this);
}

@JsonSerializable()
class TransactionCreate {
  final DateTime date;
  final double amount;
  final String description;
  final String? merchant;
  final bool isExpense;
  final bool isRecurring;
  final int? categoryId;
  final String? externalId;
  final List<int>? tagIds;

  TransactionCreate({
    required this.date,
    required this.amount,
    required this.description,
    this.merchant,
    required this.isExpense,
    this.isRecurring = false,
    this.categoryId,
    this.externalId,
    this.tagIds,
  });

  factory TransactionCreate.fromJson(Map<String, dynamic> json) => _$TransactionCreateFromJson(json);
  
  Map<String, dynamic> toJson() => _$TransactionCreateToJson(this);
}

@JsonSerializable()
class TransactionUpdate {
  final DateTime? date;
  final double? amount;
  final String? description;
  final String? merchant;
  final bool? isExpense;
  final bool? isRecurring;
  final int? categoryId;
  final List<int>? tagIds;

  TransactionUpdate({
    this.date,
    this.amount,
    this.description,
    this.merchant,
    this.isExpense,
    this.isRecurring,
    this.categoryId,
    this.tagIds,
  });

  factory TransactionUpdate.fromJson(Map<String, dynamic> json) => _$TransactionUpdateFromJson(json);
  
  Map<String, dynamic> toJson() => _$TransactionUpdateToJson(this);
} 