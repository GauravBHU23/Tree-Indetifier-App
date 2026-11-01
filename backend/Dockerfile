FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY TreeIdentifier.Api.csproj ./
RUN dotnet restore TreeIdentifier.Api.csproj
COPY . .
RUN dotnet publish TreeIdentifier.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 10000
ENV ASPNETCORE_URLS=http://+:10000

ENTRYPOINT ["dotnet", "TreeIdentifier.Api.dll"]
