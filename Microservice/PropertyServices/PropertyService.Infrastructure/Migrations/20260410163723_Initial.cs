using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PropertyService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "Sabreen_RealEstate_Management");

            migrationBuilder.CreateTable(
                name: "ref_sets",
                schema: "Sabreen_RealEstate_Management",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    key = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    created_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_ref_sets", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ref_terms",
                schema: "Sabreen_RealEstate_Management",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    key = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    created_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_ref_terms", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "set_ref_terms",
                schema: "Sabreen_RealEstate_Management",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ref_set_id = table.Column<int>(type: "integer", nullable: false),
                    ref_term_id = table.Column<int>(type: "integer", nullable: false),
                    created_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_set_ref_terms", x => x.id);
                    table.ForeignKey(
                        name: "fk_set_ref_terms_ref_sets_ref_set_id",
                        column: x => x.ref_set_id,
                        principalSchema: "Sabreen_RealEstate_Management",
                        principalTable: "ref_sets",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_set_ref_terms_ref_terms_ref_term_id",
                        column: x => x.ref_term_id,
                        principalSchema: "Sabreen_RealEstate_Management",
                        principalTable: "ref_terms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "users",
                schema: "Sabreen_RealEstate_Management",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    role_id = table.Column<int>(type: "integer", nullable: false),
                    first_name = table.Column<string>(type: "text", nullable: false),
                    last_name = table.Column<string>(type: "text", nullable: false),
                    email = table.Column<string>(type: "text", nullable: false),
                    phone = table.Column<string>(type: "text", nullable: false),
                    password_hash = table.Column<string>(type: "text", nullable: false),
                    created_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users", x => x.id);
                    table.ForeignKey(
                        name: "fk_users_ref_terms_role_id",
                        column: x => x.role_id,
                        principalSchema: "Sabreen_RealEstate_Management",
                        principalTable: "ref_terms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "properties",
                schema: "Sabreen_RealEstate_Management",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    city = table.Column<string>(type: "text", nullable: false),
                    state = table.Column<string>(type: "text", nullable: false),
                    zip_code = table.Column<string>(type: "text", nullable: false),
                    price = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    size = table.Column<int>(type: "integer", nullable: false),
                    property_type_id = table.Column<int>(type: "integer", nullable: false),
                    listing_type_id = table.Column<int>(type: "integer", nullable: false),
                    status_id = table.Column<int>(type: "integer", nullable: false),
                    created_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_properties", x => x.id);
                    table.ForeignKey(
                        name: "fk_properties_ref_terms_listing_type_id",
                        column: x => x.listing_type_id,
                        principalSchema: "Sabreen_RealEstate_Management",
                        principalTable: "ref_terms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_properties_ref_terms_property_type_id",
                        column: x => x.property_type_id,
                        principalSchema: "Sabreen_RealEstate_Management",
                        principalTable: "ref_terms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_properties_ref_terms_status_id",
                        column: x => x.status_id,
                        principalSchema: "Sabreen_RealEstate_Management",
                        principalTable: "ref_terms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_properties_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "Sabreen_RealEstate_Management",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "offers",
                schema: "Sabreen_RealEstate_Management",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    property_id = table.Column<int>(type: "integer", nullable: false),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    offer_amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    status_id = table.Column<int>(type: "integer", nullable: false),
                    created_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_offers", x => x.id);
                    table.ForeignKey(
                        name: "fk_offers_properties_property_id",
                        column: x => x.property_id,
                        principalSchema: "Sabreen_RealEstate_Management",
                        principalTable: "properties",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_offers_ref_terms_status_id",
                        column: x => x.status_id,
                        principalSchema: "Sabreen_RealEstate_Management",
                        principalTable: "ref_terms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_offers_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "Sabreen_RealEstate_Management",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "property_images",
                schema: "Sabreen_RealEstate_Management",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    property_id = table.Column<int>(type: "integer", nullable: false),
                    image_data = table.Column<byte[]>(type: "bytea", nullable: false),
                    content_type = table.Column<string>(type: "text", nullable: false),
                    created_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_property_images", x => x.id);
                    table.ForeignKey(
                        name: "fk_property_images_properties_property_id",
                        column: x => x.property_id,
                        principalSchema: "Sabreen_RealEstate_Management",
                        principalTable: "properties",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                schema: "Sabreen_RealEstate_Management",
                table: "ref_sets",
                columns: new[] { "id", "created_by", "created_date", "description", "is_active", "key", "updated_by", "updated_date" },
                values: new object[,]
                {
                    { 1, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "User Roles", true, "ROLE", null, null },
                    { 2, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Property Types", true, "PROPERTY_TYPE", null, null },
                    { 3, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Listing Types", true, "LISTING_TYPE", null, null },
                    { 4, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Status Values", true, "STATUS", null, null }
                });

            migrationBuilder.InsertData(
                schema: "Sabreen_RealEstate_Management",
                table: "ref_terms",
                columns: new[] { "id", "created_by", "created_date", "description", "is_active", "key", "updated_by", "updated_date" },
                values: new object[,]
                {
                    { 10, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Administrator", true, "ADMIN", null, null },
                    { 20, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Agent/Seller", true, "AGENT", null, null },
                    { 30, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Buyer/Renter", true, "BUYER", null, null },
                    { 40, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Apartment", true, "APARTMENT", null, null },
                    { 50, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "House", true, "HOUSE", null, null },
                    { 60, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Commercial", true, "COMMERCIAL", null, null },
                    { 70, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "For Sale", true, "FOR_SALE", null, null },
                    { 80, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "For Rent", true, "FOR_RENT", null, null },
                    { 90, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Lease", true, "LEASE", null, null },
                    { 100, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Active", true, "ACTIVE", null, null },
                    { 200, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Pending", true, "PENDING", null, null },
                    { 300, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Sold", true, "SOLD", null, null },
                    { 400, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Approved", true, "APPROVED", null, null },
                    { 500, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Rejected", true, "REJECTED", null, null }
                });

            migrationBuilder.InsertData(
                schema: "Sabreen_RealEstate_Management",
                table: "set_ref_terms",
                columns: new[] { "id", "created_by", "created_date", "is_active", "ref_set_id", "ref_term_id", "updated_by", "updated_date" },
                values: new object[,]
                {
                    { 1001, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), true, 1, 10, null, null },
                    { 1002, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), true, 1, 20, null, null },
                    { 1003, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), true, 1, 30, null, null },
                    { 1004, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), true, 2, 40, null, null },
                    { 1005, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), true, 2, 50, null, null },
                    { 1006, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), true, 2, 60, null, null },
                    { 1007, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), true, 3, 70, null, null },
                    { 1008, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), true, 3, 80, null, null },
                    { 1009, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), true, 3, 90, null, null },
                    { 1010, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), true, 4, 100, null, null },
                    { 1011, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), true, 4, 200, null, null },
                    { 1012, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), true, 4, 300, null, null },
                    { 1013, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), true, 4, 400, null, null },
                    { 1014, null, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), true, 4, 500, null, null }
                });

            migrationBuilder.CreateIndex(
                name: "ix_offers_property_id",
                schema: "Sabreen_RealEstate_Management",
                table: "offers",
                column: "property_id");

            migrationBuilder.CreateIndex(
                name: "ix_offers_status_id",
                schema: "Sabreen_RealEstate_Management",
                table: "offers",
                column: "status_id");

            migrationBuilder.CreateIndex(
                name: "ix_offers_user_id",
                schema: "Sabreen_RealEstate_Management",
                table: "offers",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_properties_listing_type_id",
                schema: "Sabreen_RealEstate_Management",
                table: "properties",
                column: "listing_type_id");

            migrationBuilder.CreateIndex(
                name: "ix_properties_property_type_id",
                schema: "Sabreen_RealEstate_Management",
                table: "properties",
                column: "property_type_id");

            migrationBuilder.CreateIndex(
                name: "ix_properties_status_id",
                schema: "Sabreen_RealEstate_Management",
                table: "properties",
                column: "status_id");

            migrationBuilder.CreateIndex(
                name: "ix_properties_user_id",
                schema: "Sabreen_RealEstate_Management",
                table: "properties",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_property_images_property_id",
                schema: "Sabreen_RealEstate_Management",
                table: "property_images",
                column: "property_id");

            migrationBuilder.CreateIndex(
                name: "ix_set_ref_terms_ref_set_id",
                schema: "Sabreen_RealEstate_Management",
                table: "set_ref_terms",
                column: "ref_set_id");

            migrationBuilder.CreateIndex(
                name: "ix_set_ref_terms_ref_term_id",
                schema: "Sabreen_RealEstate_Management",
                table: "set_ref_terms",
                column: "ref_term_id");

            migrationBuilder.CreateIndex(
                name: "ix_users_role_id",
                schema: "Sabreen_RealEstate_Management",
                table: "users",
                column: "role_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "offers",
                schema: "Sabreen_RealEstate_Management");

            migrationBuilder.DropTable(
                name: "property_images",
                schema: "Sabreen_RealEstate_Management");

            migrationBuilder.DropTable(
                name: "set_ref_terms",
                schema: "Sabreen_RealEstate_Management");

            migrationBuilder.DropTable(
                name: "properties",
                schema: "Sabreen_RealEstate_Management");

            migrationBuilder.DropTable(
                name: "ref_sets",
                schema: "Sabreen_RealEstate_Management");

            migrationBuilder.DropTable(
                name: "users",
                schema: "Sabreen_RealEstate_Management");

            migrationBuilder.DropTable(
                name: "ref_terms",
                schema: "Sabreen_RealEstate_Management");
        }
    }
}
