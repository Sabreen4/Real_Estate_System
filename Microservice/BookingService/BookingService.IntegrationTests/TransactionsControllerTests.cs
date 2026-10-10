using System.Linq;
using System.Net;
using System.Net.Http.Json;
using BookingService.Application.DTOs;
using BookingService.Domain.Entities;
using BookingService.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace BookingService.IntegrationTests;

public class TransactionsControllerTests
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public TransactionsControllerTests()
    {
        _factory = new CustomWebApplicationFactory();
        _client = _factory.CreateClient();
    }

    private async Task SeedTransactionAsync()
    {
        using var scope = _factory.Services.CreateScope();

        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // If already seeded, skip
        if (db.Transactions.Any())
            return;

        // Create STATUS set
        var statusSet = new RefSet
        {
            Id = 1,
            Key = "STATUS",
            Description = "Transaction Status",
        };

        var pending = new RefTerm
        {
            Id = 1,
            Key = "PENDING",
            Description = "Pending",
        };

        var approved = new RefTerm
        {
            Id = 2,
            Key = "APPROVED",
            Description = "Approved",
        };
        var setPending = new SetRefTerm
        {
            Id = 1,
            RefSetId = 1, // ← explicit FK
            RefTermId = 1,
        };
        var setApproved = new SetRefTerm
        {
            Id = 2,
            RefSetId = 1, // ← explicit FK
            RefTermId = 2,
        };

        db.RefSets.Add(statusSet);
        db.RefTerms.AddRange(pending, approved);
        db.SetRefTerms.AddRange(setPending, setApproved);

        await db.SaveChangesAsync();

        // Create Transaction
        var transaction = new Transaction
        {
            Id = 1,
            PropertyId = 1,
            BuyerId = 1,
            SellerId = 2,
            Amount = 50000,
            TransactionDate = DateTime.UtcNow,

            StatusId = 1,
            Status = pending,
        };

        db.Transactions.Add(transaction);
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task CreateTransaction_ShouldReturnOk()
    {
        await SeedTransactionAsync();

        var request = new CreateTransactionRequest
        {
            PropertyId = 1,
            SellerId = 2,
            Amount = 50000,
        };

        var response = await _client.PostAsJsonAsync("/api/transactions", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetTransaction_ShouldReturnOk()
    {
        await SeedTransactionAsync();

        var response = await _client.GetAsync("/api/transactions/1");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetByProperty_ShouldReturnOk()
    {
        await SeedTransactionAsync();

        var response = await _client.GetAsync("/api/properties/1/transactions");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task UpdateStatus_ShouldReturnOk()
    {
        await SeedTransactionAsync();
        var request = new UpdateStatusRequest { Status = "APPROVED" };
        var response = await _client.PutAsJsonAsync("/api/transactions/1/status", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
