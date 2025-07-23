import 'dart:convert';
import 'package:json_annotation/json_annotation.dart';

part 'report.g.dart';

@JsonSerializable()
class MonthlyReport {
  final int year;
  final int month;
  final double totalIncome;
  final double totalExpenses;
  final double net;
  final Map<String, double> expensesByCategory;
  final Map<String, double> incomeByCategory;

  MonthlyReport({
    required this.year,
    required this.month,
    required this.totalIncome,
    required this.totalExpenses,
    required this.net,
    required this.expensesByCategory,
    required this.incomeByCategory,
  });

  factory MonthlyReport.fromJson(Map<String, dynamic> json) => _$MonthlyReportFromJson(json);
  
  Map<String, dynamic> toJson() => _$MonthlyReportToJson(this);
}

@JsonSerializable()
class PeriodReport {
  final DateTime startDate;
  final DateTime endDate;
  final double totalIncome;
  final double totalExpenses;
  final double net;
  final Map<String, double> expensesByCategory;
  final Map<String, double> incomeByCategory;
  final Map<String, double> expensesByTag;
  final Map<String, double> incomeByTag;

  PeriodReport({
    required this.startDate,
    required this.endDate,
    required this.totalIncome,
    required this.totalExpenses,
    required this.net,
    required this.expensesByCategory,
    required this.incomeByCategory,
    required this.expensesByTag,
    required this.incomeByTag,
  });

  factory PeriodReport.fromJson(Map<String, dynamic> json) => _$PeriodReportFromJson(json);
  
  Map<String, dynamic> toJson() => _$PeriodReportToJson(this);
}

@JsonSerializable()
class TrendData {
  final DateTime date;
  final double amount;

  TrendData({
    required this.date,
    required this.amount,
  });

  factory TrendData.fromJson(Map<String, dynamic> json) => _$TrendDataFromJson(json);
  
  Map<String, dynamic> toJson() => _$TrendDataToJson(this);
}

@JsonSerializable()
class TrendResponse {
  final List<TrendData> expenses;
  final List<TrendData> income;

  TrendResponse({
    required this.expenses,
    required this.income,
  });

  factory TrendResponse.fromJson(Map<String, dynamic> json) => _$TrendResponseFromJson(json);
  
  Map<String, dynamic> toJson() => _$TrendResponseToJson(this);
} 