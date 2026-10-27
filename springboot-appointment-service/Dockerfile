FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY . .
RUN mvn -B -pl springboot-appointment-service -am package -DskipTests
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S care && adduser -S care -G care
WORKDIR /app
COPY --from=build /build/springboot-appointment-service/target/springboot-appointment-service-1.0.0.jar app.jar
USER care
EXPOSE 8080
ENTRYPOINT ["java","-XX:MaxRAMPercentage=70","-jar","app.jar"]
